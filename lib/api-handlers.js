require("./load-env");
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

      console.error("API request failed:", error);
      return sendJson(res, 500, { message: "Internal server error." });
    }
  };
}

function configError(message) {
  const error = new Error(message);
  error.code = "CONFIG_ERROR";
  return error;
}

async function getHtmlAssistantStatus() {
  return {
    status: 200,
    body: {
      ok: true,
      htmlAssistantConfigured: Boolean(process.env.GROQ_API_KEY),
      htmlAssistantModel: process.env.GROQ_HTML_ASSISTANT_MODEL || "llama-3.1-8b-instant",
      provider: "groq"
    }
  };
}

async function answerHtmlAssistant(payload) {
  const question = typeof payload?.question === "string" ? payload.question.trim() : "";
  const history = Array.isArray(payload?.history) ? payload.history : [];
  if (!question) {
    return {
      status: 400,
      body: { message: "Question is required." }
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw configError("GROQ_API_KEY is not configured.");
  }

  const model = process.env.GROQ_HTML_ASSISTANT_MODEL || "llama-3.1-8b-instant";
  const sanitizedHistory = history
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .map((item) => ({
      role: item.role,
      text: String(item.text || "").trim()
    }))
    .filter((item) => item.text)
    .slice(-12);

  const messages = [
    {
      role: "system",
      content: "You are a warm, capable HTML chatbot and tutor. Answer only questions about HTML, semantic markup, forms, tables, media, accessibility, debugging markup mistakes, and browser HTML behavior. Be conversational and helpful like a real chat assistant. Prefer short paragraphs, clear steps, and practical examples. When useful, include small HTML code blocks. If the user is debugging, explain what is wrong, show the corrected HTML, and mention why it works. If the user asks something unrelated to HTML, politely redirect them back to HTML topics."
    },
    ...sanitizedHistory.map((item) => ({
      role: item.role,
      content: item.text
    })),
    {
      role: "user",
      content: question
    }
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 700
    })
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      "The HTML assistant request failed.";

    return {
      status: response.status,
      body: { message }
    };
  }

  const answer = String(data?.choices?.[0]?.message?.content || "").trim();
  if (!answer) {
    return {
      status: 502,
      body: { message: "The AI response was empty." }
    };
  }

  return {
    status: 200,
    body: {
      answer,
      model: data?.model || model,
      provider: "groq"
    }
  };
}

const handleHealthRequest = createHandler("GET", () => getHealth());
const handleHtmlAssistantStatusRequest = createHandler("GET", () => getHtmlAssistantStatus());
const handleHtmlAssistantRequest = createHandler("POST", (payload) => answerHtmlAssistant(payload), true);
const handleSignupRequest = createHandler("POST", (payload, req) => signup(payload, req), true);
const handleSigninRequest = createHandler("POST", (payload, req) => signin(payload, req), true);

module.exports = {
  applyCorsHeaders,
  handleHealthRequest,
  handleHtmlAssistantStatusRequest,
  handleHtmlAssistantRequest,
  handleSigninRequest,
  handleSignupRequest,
  sendJson
};
