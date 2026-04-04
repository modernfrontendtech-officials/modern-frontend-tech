require("./load-env");
const crypto = require("node:crypto");
const { ObjectId } = require("mongodb");
const { getMongoClient } = require("./mongodb");

const AUTH_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 45;
const DEFAULT_AUTH_TOKEN_SECRET = "learnhtmlforfree-local-dev-secret";

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

function getAuthTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET || DEFAULT_AUTH_TOKEN_SECRET;
}

function encodeBase64UrlJson(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeBase64UrlJson(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signTokenFragment(fragment) {
  return crypto.createHmac("sha256", getAuthTokenSecret()).update(fragment).digest("base64url");
}

function tokenSignatureMatches(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ""), "utf8");
  const expectedBuffer = Buffer.from(String(expected || ""), "utf8");
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function createAuthToken(user) {
  const now = Date.now();
  const payload = {
    uid: user._id.toString(),
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + AUTH_TOKEN_LIFETIME_MS
  };

  const encoded = encodeBase64UrlJson(payload);
  return `${encoded}.${signTokenFragment(encoded)}`;
}

function verifyAuthToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signTokenFragment(encodedPayload);
  if (!tokenSignatureMatches(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = decodeBase64UrlJson(encodedPayload);
    if (!payload?.uid || !payload?.email || !payload?.exp) return null;
    if (Number(payload.exp) <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function readBearerToken(req) {
  const header = String(req.headers?.authorization || "").trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function createDefaultProfile() {
  return {
    streak: {
      current: 0,
      longest: 0,
      lastActiveDay: "",
      totalActiveDays: 0
    },
    lessonHistory: [],
    quizResults: [],
    challengeResults: [],
    examResults: [],
    certificates: [],
    recentActivity: [],
    stats: {
      lessonsExplored: 0,
      quizzesCompleted: 0,
      challengesTracked: 0,
      examsTaken: 0,
      certificatesEarned: 0
    }
  };
}

function dayKeyFrom(dateValue = new Date()) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

function previousDayKey(dayKey) {
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return dayKeyFrom(date);
}

function sortByDateDesc(items, key) {
  return items.sort((left, right) => {
    const leftTime = new Date(left?.[key] || 0).getTime();
    const rightTime = new Date(right?.[key] || 0).getTime();
    return rightTime - leftTime;
  });
}

function pushRecentActivity(profile, entry) {
  profile.recentActivity = [
    entry,
    ...profile.recentActivity.filter((item) => !(item.type === entry.type && item.key === entry.key))
  ].slice(0, 24);
}

function recalculateProfileStats(profile) {
  profile.stats = {
    lessonsExplored: profile.lessonHistory.length,
    quizzesCompleted: profile.quizResults.length,
    challengesTracked: profile.challengeResults.length,
    examsTaken: profile.examResults.length,
    certificatesEarned: profile.certificates.length
  };

  return profile;
}

function normalizeProfile(profile) {
  const defaults = createDefaultProfile();
  const safeProfile = profile && typeof profile === "object" ? profile : {};

  const normalized = {
    ...defaults,
    ...safeProfile,
    streak: {
      ...defaults.streak,
      ...(safeProfile.streak && typeof safeProfile.streak === "object" ? safeProfile.streak : {})
    },
    lessonHistory: Array.isArray(safeProfile.lessonHistory) ? safeProfile.lessonHistory.filter(Boolean) : [],
    quizResults: Array.isArray(safeProfile.quizResults) ? safeProfile.quizResults.filter(Boolean) : [],
    challengeResults: Array.isArray(safeProfile.challengeResults) ? safeProfile.challengeResults.filter(Boolean) : [],
    examResults: Array.isArray(safeProfile.examResults) ? safeProfile.examResults.filter(Boolean) : [],
    certificates: Array.isArray(safeProfile.certificates) ? safeProfile.certificates.filter(Boolean) : [],
    recentActivity: Array.isArray(safeProfile.recentActivity) ? safeProfile.recentActivity.filter(Boolean) : []
  };

  sortByDateDesc(normalized.lessonHistory, "lastVisitedAt");
  sortByDateDesc(normalized.quizResults, "checkedAt");
  sortByDateDesc(normalized.challengeResults, "updatedAt");
  sortByDateDesc(normalized.examResults, "submittedAt");
  sortByDateDesc(normalized.certificates, "issuedAt");
  sortByDateDesc(normalized.recentActivity, "at");

  return recalculateProfileStats(normalized);
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null
  };
}

function serializeProfile(profile) {
  const normalized = normalizeProfile(profile);
  return {
    streak: normalized.streak,
    stats: normalized.stats,
    lessonsExplored: normalized.lessonHistory,
    quizResults: normalized.quizResults,
    challengeResults: normalized.challengeResults,
    examResults: normalized.examResults,
    certificates: normalized.certificates,
    recentActivity: normalized.recentActivity
  };
}

function buildAuthSuccessBody(message, user, profile) {
  return {
    message,
    token: createAuthToken(user),
    user: {
      ...serializeUser(user),
      streak: normalizeProfile(profile).streak
    }
  };
}

function applyDailyActivity(profile, { at, dateKey, page }) {
  const streak = profile.streak;
  if (streak.lastActiveDay === dateKey) {
    return false;
  }

  const continued = streak.lastActiveDay === previousDayKey(dateKey);
  streak.current = continued ? Number(streak.current || 0) + 1 : 1;
  streak.longest = Math.max(Number(streak.longest || 0), streak.current);
  streak.lastActiveDay = dateKey;
  streak.totalActiveDays = Number(streak.totalActiveDays || 0) + 1;

  pushRecentActivity(profile, {
    type: "daily_visit",
    key: `daily-${dateKey}`,
    label: "Daily visit recorded",
    at,
    meta: {
      page: page || "site"
    }
  });

  return true;
}

function recordLessonVisit(profile, payload, at) {
  const page = String(payload?.page || "").trim().toLowerCase();
  if (!page) return false;

  const title = String(payload?.title || payload?.heading || page).trim();
  const heading = String(payload?.heading || payload?.title || "").trim();
  const existing = profile.lessonHistory.find((item) => item.page === page);

  if (existing) {
    existing.title = title || existing.title;
    existing.heading = heading || existing.heading;
    existing.lastVisitedAt = at;
    existing.visitCount = Number(existing.visitCount || 0) + 1;
  } else {
    profile.lessonHistory.push({
      page,
      title,
      heading,
      visitCount: 1,
      firstVisitedAt: at,
      lastVisitedAt: at
    });
  }

  sortByDateDesc(profile.lessonHistory, "lastVisitedAt");
  recalculateProfileStats(profile);

  pushRecentActivity(profile, {
    type: "lesson_visit",
    key: `lesson-${page}`,
    label: `Explored ${title || page}`,
    at,
    meta: {
      page,
      title
    }
  });

  return true;
}

function recordQuizResult(profile, payload, at) {
  const page = String(payload?.page || "").trim().toLowerCase();
  const title = String(payload?.title || page || "Lesson quiz").trim();
  const score = Number(payload?.score);
  const totalQuestions = Number(payload?.totalQuestions || payload?.total || 0);

  if (!page || !Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return false;
  }

  const percentage = Math.round((score / totalQuestions) * 1000) / 10;
  const existing = profile.quizResults.find((item) => item.page === page);

  if (existing) {
    existing.title = title || existing.title;
    existing.score = score;
    existing.totalQuestions = totalQuestions;
    existing.percentage = percentage;
    existing.checkedAt = at;
    existing.bestScore = Math.max(Number(existing.bestScore || 0), score);
  } else {
    profile.quizResults.push({
      page,
      title,
      score,
      bestScore: score,
      totalQuestions,
      percentage,
      checkedAt: at
    });
  }

  sortByDateDesc(profile.quizResults, "checkedAt");
  recalculateProfileStats(profile);

  pushRecentActivity(profile, {
    type: "lesson_quiz_result",
    key: `quiz-${page}`,
    label: `${title} scored ${score}/${totalQuestions}`,
    at,
    meta: {
      page,
      score,
      totalQuestions,
      percentage
    }
  });

  return true;
}

function recordChallengeResult(profile, payload, at) {
  const challengeType = String(payload?.challengeType || "weekly").trim().toLowerCase();
  const challengeKey = String(payload?.challengeKey || payload?.weekToken || "").trim();
  const label = String(payload?.label || payload?.weekLabel || challengeKey || "Challenge progress").trim();

  if (!challengeKey) return false;

  const startedCount = Math.max(0, Number(payload?.startedCount || 0));
  const totalCount = Math.max(startedCount, Number(payload?.totalCount || 0));
  const completedCount = Math.max(0, Number(payload?.completedCount || startedCount));
  const storageKey = `${challengeType}:${challengeKey}`;
  const existing = profile.challengeResults.find((item) => item.key === storageKey);

  if (existing) {
    existing.label = label || existing.label;
    existing.startedCount = startedCount;
    existing.totalCount = totalCount;
    existing.completedCount = completedCount;
    existing.updatedAt = at;
  } else {
    profile.challengeResults.push({
      key: storageKey,
      challengeType,
      challengeKey,
      label,
      startedCount,
      totalCount,
      completedCount,
      updatedAt: at
    });
  }

  sortByDateDesc(profile.challengeResults, "updatedAt");
  recalculateProfileStats(profile);

  pushRecentActivity(profile, {
    type: "weekly_challenge_result",
    key: `challenge-${storageKey}`,
    label: `${label}: ${startedCount}/${totalCount} started`,
    at,
    meta: {
      challengeType,
      challengeKey,
      startedCount,
      totalCount,
      completedCount
    }
  });

  return true;
}

function recordExamResult(profile, payload, at) {
  const submittedAt = String(payload?.submittedAt || at).trim() || at;
  const studentName = String(payload?.studentName || "").trim();
  const score = Number(payload?.score || payload?.correctCount || 0);
  const total = Math.max(score, Number(payload?.total || 0));
  const percentage = Number(payload?.percentage || 0);
  const status = String(payload?.status || "").trim();
  const certificate = String(payload?.certificate || "None").trim() || "None";
  const certificateId = String(payload?.certificateId || "").trim();
  const resultKey = certificateId || submittedAt;

  if (!total || !status) return false;

  const existing = profile.examResults.find((item) => item.key === resultKey);
  const result = {
    key: resultKey,
    studentName,
    score,
    total,
    percentage,
    status,
    certificate,
    certificateId,
    submittedAt
  };

  if (existing) {
    Object.assign(existing, result);
  } else {
    profile.examResults.push(result);
  }

  if (certificate && certificate !== "None" && certificateId) {
    const certificateRecord = {
      key: certificateId,
      type: "html_exam",
      level: certificate,
      certificateId,
      studentName,
      score,
      total,
      percentage,
      issuedAt: submittedAt
    };

    const existingCertificate = profile.certificates.find((item) => item.key === certificateId);
    if (existingCertificate) {
      Object.assign(existingCertificate, certificateRecord);
    } else {
      profile.certificates.push(certificateRecord);
    }
  }

  sortByDateDesc(profile.examResults, "submittedAt");
  sortByDateDesc(profile.certificates, "issuedAt");
  recalculateProfileStats(profile);

  pushRecentActivity(profile, {
    type: "exam_result",
    key: `exam-${resultKey}`,
    label: certificate && certificate !== "None"
      ? `Earned ${certificate} certificate`
      : `Completed exam with ${score}/${total}`,
    at,
    meta: {
      score,
      total,
      percentage,
      status,
      certificate,
      certificateId
    }
  });

  return true;
}

async function saveProfile(db, userId, profile) {
  const normalized = normalizeProfile(profile);
  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        profile: normalized,
        updatedAt: new Date()
      }
    }
  );
  return normalized;
}

async function getAuthorizedUserContext(req) {
  const token = readBearerToken(req);
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload?.uid || !payload?.email) return null;

  let userId;
  try {
    userId = new ObjectId(payload.uid);
  } catch {
    return null;
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: userId },
    {
      projection: {
        _id: 1,
        name: 1,
        email: 1,
        avatarUrl: 1,
        profile: 1
      }
    }
  );

  if (!user || String(user.email || "").toLowerCase() !== String(payload.email || "").toLowerCase()) {
    return null;
  }

  return {
    db,
    user,
    profile: normalizeProfile(user.profile)
  };
}

function unauthorized(message = "Sign in again to continue.") {
  return {
    status: 401,
    body: { message }
  };
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
      storage: "persistent",
      htmlAssistantConfigured: Boolean(process.env.OPENAI_API_KEY),
      htmlAssistantModel: process.env.OPENAI_HTML_ASSISTANT_MODEL || "gpt-5.2"
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
    const createdAt = new Date();
    const insertedProfile = createDefaultProfile();
    applyDailyActivity(insertedProfile, {
      at: createdAt.toISOString(),
      dateKey: dayKeyFrom(createdAt),
      page: "signup"
    });

    const result = await users.insertOne({
      name,
      email,
      passwordHash: hashPassword(password),
      authProvider: "password",
      googleSub: null,
      avatarUrl: null,
      profile: normalizeProfile(insertedProfile),
      createdAt,
      updatedAt: createdAt
    });

    await addEvent(db, {
      userId: result.insertedId,
      email,
      eventType: "signup",
      success: true,
      req
    });

    const user = await users.findOne(
      { _id: result.insertedId },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          avatarUrl: 1,
          profile: 1
        }
      }
    );

    return {
      status: 201,
      body: buildAuthSuccessBody("Signup successful.", user, user.profile)
    };
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
        _id: 1,
        name: 1,
        email: 1,
        passwordHash: 1,
        avatarUrl: 1,
        profile: 1
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

  const profile = normalizeProfile(user.profile);
  const now = new Date();
  const changed = applyDailyActivity(profile, {
    at: now.toISOString(),
    dateKey: dayKeyFrom(now),
    page: "signin"
  });

  const savedProfile = changed ? await saveProfile(db, user._id, profile) : profile;

  return {
    status: 200,
    body: buildAuthSuccessBody(`Welcome back, ${user.name}!`, user, savedProfile)
  };
}

async function getProfile(req) {
  const context = await getAuthorizedUserContext(req);
  if (!context) {
    return unauthorized();
  }

  return {
    status: 200,
    body: {
      ok: true,
      user: serializeUser(context.user),
      profile: serializeProfile(context.profile)
    }
  };
}

async function recordProfileActivity(input, req) {
  const context = await getAuthorizedUserContext(req);
  if (!context) {
    return unauthorized();
  }

  const eventType = String(input?.eventType || "").trim();
  if (!eventType) {
    return {
      status: 400,
      body: { message: "Activity eventType is required." }
    };
  }

  const now = new Date();
  const at = now.toISOString();
  const profile = normalizeProfile(context.profile);
  let changed = applyDailyActivity(profile, {
    at,
    dateKey: dayKeyFrom(now),
    page: String(input?.page || eventType || "site")
  });

  switch (eventType) {
    case "daily_visit":
      break;
    case "lesson_visit":
      changed = recordLessonVisit(profile, input, at) || changed;
      break;
    case "lesson_quiz_result":
      changed = recordQuizResult(profile, input, at) || changed;
      break;
    case "weekly_challenge_result":
      changed = recordChallengeResult(profile, input, at) || changed;
      break;
    case "exam_result":
      changed = recordExamResult(profile, input, at) || changed;
      break;
    default:
      return {
        status: 400,
        body: { message: `Unsupported profile event type: ${eventType}.` }
      };
  }

  const savedProfile = changed ? await saveProfile(context.db, context.user._id, profile) : profile;

  return {
    status: 200,
    body: {
      ok: true,
      streak: savedProfile.streak,
      stats: savedProfile.stats,
      profile: serializeProfile(savedProfile)
    }
  };
}

module.exports = {
  getHealth,
  getProfile,
  isAllowedOrigin,
  recordProfileActivity,
  signin,
  signup
};
