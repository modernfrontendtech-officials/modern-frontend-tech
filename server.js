const express = require("express");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

const PORT = process.env.PORT || 3000;

function isAllowedOrigin(origin) {
  if (!origin || origin === "null") return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlitePath = path.join(dataDir, "auth.sqlite");
const legacyJsonPath = path.join(dataDir, "auth-db.json");

function createSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT NOT NULL,
      event_type TEXT NOT NULL,
      success INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) {
      stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    return rows;
  } finally {
    stmt.free();
  }
}

function ensureUserSchema(db) {
  const columns = new Set(queryAll(db, "PRAGMA table_info(users)").map((row) => String(row.name)));
  if (!columns.has("auth_provider")) {
    db.run("ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password'");
  }
  if (!columns.has("google_sub")) {
    db.run("ALTER TABLE users ADD COLUMN google_sub TEXT");
  }
  if (!columns.has("avatar_url")) {
    db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT");
  }
}

function queryOne(db, sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) {
      stmt.bind(params);
    }
    return stmt.step() ? stmt.getAsObject() : null;
  } finally {
    stmt.free();
  }
}

function persistDb(db) {
  fs.writeFileSync(sqlitePath, Buffer.from(db.export()));
}

function migrateLegacyJson(db) {
  if (!fs.existsSync(legacyJsonPath)) return;
  const hasUsers = Number(queryOne(db, "SELECT COUNT(*) AS count FROM users").count || 0) > 0;
  const hasEvents = Number(queryOne(db, "SELECT COUNT(*) AS count FROM auth_events").count || 0) > 0;
  if (hasUsers || hasEvents) return;

  try {
    const raw = fs.readFileSync(legacyJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    const users = Array.isArray(parsed.users) ? parsed.users : [];
    const events = Array.isArray(parsed.auth_events) ? parsed.auth_events : [];

    db.run("BEGIN");
    for (const user of users) {
      db.run(
        "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        [
        Number(user.id),
        String(user.name || ""),
        String(user.email || "").toLowerCase(),
        String(user.password_hash || ""),
        String(user.created_at || new Date().toISOString())
        ]
      );
    }

    for (const event of events) {
      db.run(
        `INSERT INTO auth_events
        (id, user_id, email, event_type, success, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
        Number(event.id),
        event.user_id == null ? null : Number(event.user_id),
        String(event.email || "").toLowerCase(),
        String(event.event_type || ""),
        Number(event.success ? 1 : 0),
        event.ip_address || null,
        event.user_agent || null,
        String(event.created_at || new Date().toISOString())
        ]
      );
    }
    db.run("COMMIT");
    persistDb(db);
  } catch (error) {
    try {
      db.run("ROLLBACK");
    } catch {}
    console.error("Legacy auth JSON migration failed:", error);
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || "").split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(actualHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || null;
}

function addEvent(db, { userId, email, eventType, success, req }) {
  db.run(
    `INSERT INTO auth_events
    (user_id, email, event_type, success, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId ?? null,
      email,
      eventType,
      success ? 1 : 0,
      clientIp(req),
      req.headers["user-agent"] || null,
      new Date().toISOString()
    ]
  );
}

async function openDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "node_modules", "sql.js", "dist", file)
  });

  const hasFile = fs.existsSync(sqlitePath) && fs.statSync(sqlitePath).size > 0;
  const db = hasFile ? new SQL.Database(fs.readFileSync(sqlitePath)) : new SQL.Database();
  createSchema(db);
  ensureUserSchema(db);
  migrateLegacyJson(db);
  if (!hasFile) {
    persistDb(db);
  }
  return db;
}

async function startServer() {
  const db = await openDatabase();
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    } else if (!origin) {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.static(__dirname));

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ message: "Invalid JSON payload." });
    }
    next(err);
  });

  app.get("/api/health", (req, res) => {
    const row = queryOne(db, "SELECT COUNT(*) AS count FROM users");
    return res.status(200).json({
      ok: true,
      db: path.basename(sqlitePath),
      users: Number(row.count || 0)
    });
  });

  app.post("/api/signup", (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const exists = queryOne(
      db,
      `SELECT id, name, email, password_hash, auth_provider, google_sub
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    if (exists) {
      addEvent(db, { userId: null, email, eventType: "signup", success: false, req });
      persistDb(db);
      return res.status(409).json({ message: "Email is already registered." });
    }

    db.run(
      `INSERT INTO users (name, email, password_hash, created_at, auth_provider, google_sub, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashPassword(password), new Date().toISOString(), "password", null, null]
    );
    const row = queryOne(db, "SELECT last_insert_rowid() AS id");
    addEvent(db, {
      userId: Number(row.id || 0),
      email,
      eventType: "signup",
      success: true,
      req
    });
    persistDb(db);
    return res.status(201).json({ message: "Signup successful." });
  });

  app.post("/api/signin", (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = queryOne(
      db,
      `SELECT id, name, email, password_hash, auth_provider, google_sub, avatar_url
       FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    const ok = user ? verifyPassword(password, user.password_hash) : false;

    addEvent(db, {
      userId: user ? Number(user.id) : null,
      email,
      eventType: "signin",
      success: ok,
      req
    });
    persistDb(db);

    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({ message: `Welcome back, ${user.name}!` });
  });
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`SQLite database: ${sqlitePath}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start auth server:", error);
  process.exit(1);
});
