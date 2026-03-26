const crypto = require("node:crypto");
const { getMongoClient } = require("./mongodb");

let indexesPromise = null;
let indexedDatabaseName = null;

function isVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function getRequestHost(req) {
  return String(req.headers?.["x-forwarded-host"] || req.headers?.host || "").toLowerCase();
}

function isAllowedOrigin(origin, req) {
  if (!origin || origin === "null") return true;

  try {
    const originUrl = new URL(origin);
    if (originUrl.host.toLowerCase() === getRequestHost(req)) {
      return true;
    }
  } catch {
    return false;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

async function ensureIndexes(db) {
  if (indexesPromise && indexedDatabaseName === db.databaseName) {
    return indexesPromise;
  }

  indexedDatabaseName = db.databaseName;
  indexesPromise = Promise.all([
    db.collection("users").createIndex(
      { email: 1 },
      { unique: true, name: "users_email_unique" }
    ),
    db.collection("authEvents").createIndex(
      { createdAt: -1 },
      { name: "auth_events_created_at_desc" }
    ),
    db.collection("authEvents").createIndex(
      { email: 1, createdAt: -1 },
      { name: "auth_events_email_created_at_desc" }
    )
  ]).catch((error) => {
    indexesPromise = null;
    throw error;
  });

  return indexesPromise;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || "").split(":");
  if (!salt || !expectedHash) return false;

  const actual = Buffer.from(crypto.scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;

  return crypto.timingSafeEqual(actual, expected);
}

function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

async function addEvent(db, { userId, email, eventType, success, req }) {
  await db.collection("authEvents").insertOne({
    userId: userId ?? null,
    email,
    eventType,
    success: Boolean(success),
    ipAddress: clientIp(req),
    userAgent: req.headers?.["user-agent"] || null,
    createdAt: new Date()
  });
}

function getDatabase(client) {
  const databaseName = process.env.MONGODB_DB;
  return databaseName ? client.db(databaseName) : client.db();
}

async function getDb() {
  const client = await getMongoClient();
  const db = getDatabase(client);
  await ensureIndexes(db);
  return db;
}

async function getHealth() {
  const db = await getDb();
  const users = await db.collection("users").countDocuments();

  return {
    status: 200,
    body: {
      ok: true,
      db: db.databaseName,
      users,
      engine: "mongodb",
      runtime: isVercelRuntime() ? "vercel" : "node",
      storage: "persistent"
    }
  };
}

async function signup(input, req) {
  const db = await getDb();
  const users = db.collection("users");
  const name = String(input?.name || "").trim();
  const email = String(input?.email || "").trim().toLowerCase();
  const password = String(input?.password || "");

  if (!name || !email || !password) {
    return {
      status: 400,
      body: { message: "Name, email, and password are required." }
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: 400,
      body: { message: "Enter a valid email address." }
    };
  }

  if (password.length < 6) {
    return {
      status: 400,
      body: { message: "Password must be at least 6 characters." }
    };
  }

  const exists = await users.findOne(
    { email },
    { projection: { _id: 1 } }
  );

  if (exists) {
    await addEvent(db, { userId: null, email, eventType: "signup", success: false, req });
    return {
      status: 409,
      body: { message: "Email is already registered." }
    };
  }

  try {
    const result = await users.insertOne({
      name,
      email,
      passwordHash: hashPassword(password),
      authProvider: "password",
      googleSub: null,
      avatarUrl: null,
      createdAt: new Date()
    });

    await addEvent(db, {
      userId: result.insertedId,
      email,
      eventType: "signup",
      success: true,
      req
    });
  } catch (error) {
    if (error?.code === 11000) {
      await addEvent(db, { userId: null, email, eventType: "signup", success: false, req });
      return {
        status: 409,
        body: { message: "Email is already registered." }
      };
    }
    throw error;
  }

  return {
    status: 201,
    body: {
      message: "Signup successful.",
      user: { name, email }
    }
  };
}

async function signin(input, req) {
  const db = await getDb();
  const users = db.collection("users");
  const email = String(input?.email || "").trim().toLowerCase();
  const password = String(input?.password || "");

  if (!email || !password) {
    return {
      status: 400,
      body: { message: "Email and password are required." }
    };
  }

  const user = await users.findOne(
    { email },
    {
      projection: {
        name: 1,
        email: 1,
        passwordHash: 1,
        avatarUrl: 1
      }
    }
  );
  const ok = user ? verifyPassword(password, user.passwordHash) : false;

  await addEvent(db, {
    userId: user?._id || null,
    email,
    eventType: "signin",
    success: ok,
    req
  });

  if (!ok) {
    return {
      status: 401,
      body: { message: "Invalid email or password." }
    };
  }

  return {
    status: 200,
    body: {
      message: `Welcome back, ${user.name}!`,
      user: {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || null
      }
    }
  };
}

module.exports = {
  getHealth,
  isAllowedOrigin,
  signin,
  signup
};
