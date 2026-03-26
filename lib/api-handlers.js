const { getHealth, isAllowedOrigin, signin, signup } = require("./auth-service");

function setHeader(res, name, value) {
  if (typeof res.setHeader === "function") {
    res.setHeader(name, value);
    return;
  }
  if (typeof res.header === "function") {
    res.header(name, value);
  }
}

function applyCorsHeaders(req, res) {
  const origin = req.headers?.origin;

  if (origin && isAllowedOrigin(origin, req)) {
    setHeader(res, "Access-Control-Allow-Origin", origin);
    setHeader(res, "Vary", "Origin");
  } else if (!origin) {
    setHeader(res, "Access-Control-Allow-Origin", "*");
  }

  setHeader(res, "Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  setHeader(res, "Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, payload) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(payload);
  }

  setHeader(res, "Content-Type", "application/json; charset=utf-8");
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function sendEmpty(res, status = 204) {
  if (typeof res.status === "function") {
    return res.status(status).end();
  }

  res.statusCode = status;
  res.end();
}

function invalidJsonError() {
  const error = new Error("Invalid JSON payload.");
  error.code = "INVALID_JSON_PAYLOAD";
  return error;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    const raw = req.body.trim();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      throw invalidJsonError();
    }
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw invalidJsonError();
  }
}

function createHandler(expectedMethod, action, needsBody = false) {
  return async function handler(req, res) {
    applyCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return sendEmpty(res, 204);
    }

    if (req.method !== expectedMethod) {
      setHeader(res, "Allow", `${expectedMethod}, OPTIONS`);
      return sendJson(res, 405, {
        message: `Method ${req.method} not allowed.`
      });
    }

    try {
      const payload = needsBody ? await readJsonBody(req) : undefined;
      const result = await action(payload, req);
      return sendJson(res, result.status, result.body);
    } catch (error) {
      if (error?.code === "CONFIG_ERROR") {
        return sendJson(res, 500, { message: error.message });
      }
      if (error?.code === "INVALID_JSON_PAYLOAD") {
        return sendJson(res, 400, { message: "Invalid JSON payload." });
      }

      console.error("Auth API request failed:", error);
      return sendJson(res, 500, { message: "Internal server error." });
    }
  };
}

const handleHealthRequest = createHandler("GET", () => getHealth());
const handleSignupRequest = createHandler("POST", (payload, req) => signup(payload, req), true);
const handleSigninRequest = createHandler("POST", (payload, req) => signin(payload, req), true);

module.exports = {
  applyCorsHeaders,
  handleHealthRequest,
  handleSigninRequest,
  handleSignupRequest,
  sendJson
};
