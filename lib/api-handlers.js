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

function extractJsonPayload(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;

  try {
    return JSON.parse(candidate);
  } catch {}

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function safeText(value, fallback, maxLength = 80) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) return fallback;
  return text.slice(0, maxLength);
}

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "").trim()) ? String(value).trim() : fallback;
}

function normalizePose(value) {
  const input = value && typeof value === "object" ? value : {};
  return {
    headTilt: clampNumber(input.headTilt, 0, -90, 90),
    torsoTilt: clampNumber(input.torsoTilt, 0, -90, 90),
    leftArm: clampNumber(input.leftArm, -20, -90, 90),
    rightArm: clampNumber(input.rightArm, 30, -90, 90),
    leftLeg: clampNumber(input.leftLeg, 4, -90, 90),
    rightLeg: clampNumber(input.rightLeg, -4, -90, 90),
    bounce: clampNumber(input.bounce, 0, 0, 30)
  };
}

function normalizeKeyframes(value) {
  const frames = Array.isArray(value) ? value : [];
  return frames
    .slice(0, 6)
    .map((item, index) => ({
      frame: clampNumber(item?.frame, index * 12, 0, 240),
      x: clampNumber(item?.x, 480, 20, 940),
      y: clampNumber(item?.y, 270, 20, 520),
      width: clampNumber(item?.width, 240, 70, 700),
      height: clampNumber(item?.height, 160, 60, 460),
      scale: clampNumber(item?.scale, 1, 0.2, 3),
      rotation: clampNumber(item?.rotation, 0, -180, 180),
      opacity: clampNumber(item?.opacity, 1, 0.05, 1),
      zIndex: clampNumber(item?.zIndex, index + 1, 1, 200),
      pose: normalizePose(item?.pose)
    }))
    .sort((a, b) => a.frame - b.frame);
}

function normalizeElement(value, index = 0) {
  const allowed = new Set(["blob", "burst", "window", "title", "ring", "sticker", "panel"]);
  return {
    id: safeText(value?.id, `generated-element-${index + 1}`, 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    kind: "element",
    assetType: allowed.has(value?.assetType) ? value.assetType : "blob",
    name: safeText(value?.name, `Generated element ${index + 1}`),
    description: safeText(value?.description, "API generated animation element.", 120),
    label: safeText(value?.label, "New element", 36),
    text: safeText(value?.text, "", 120),
    color: safeColor(value?.color, "#ff7b54"),
    accent: safeColor(value?.accent, "#4fd1c5"),
    textColor: safeColor(value?.textColor, "#f8fafc"),
    width: clampNumber(value?.width, 240, 80, 700),
    height: clampNumber(value?.height, 160, 70, 460)
  };
}

function normalizeCharacter(value) {
  return {
    id: safeText(value?.id, "generated-character", 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    kind: "character",
    name: safeText(value?.name, "Generated host"),
    description: safeText(value?.description, "API generated poseable character.", 120),
    color: safeColor(value?.color, "#ff7b54"),
    accent: safeColor(value?.accent, "#4fd1c5"),
    skin: safeColor(value?.skin, "#ffd09a"),
    width: clampNumber(value?.width, 200, 120, 360),
    height: clampNumber(value?.height, 290, 160, 420),
    pose: normalizePose(value?.pose)
  };
}

function normalizeTemplateObject(value, index = 0) {
  if (value?.kind === "character") {
    const character = normalizeCharacter(value);
    return {
      ...character,
      x: clampNumber(value?.x, 760, 20, 940),
      y: clampNumber(value?.y, 380, 20, 520),
      keyframes: normalizeKeyframes(value?.keyframes)
    };
  }

  const element = normalizeElement(value, index);
  return {
    ...element,
    x: clampNumber(value?.x, 480, 20, 940),
    y: clampNumber(value?.y, 270, 20, 520),
    keyframes: normalizeKeyframes(value?.keyframes)
  };
}

function normalizeTemplate(value, index = 0) {
  const objects = Array.isArray(value?.objects) && value.objects.length
    ? value.objects.slice(0, 8).map((item, objectIndex) => normalizeTemplateObject(item, objectIndex))
    : [
        {
          kind: "element",
          assetType: "title",
          name: "Generated title",
          label: "Animate your story",
          text: "Drop assets, pose a host, and capture keyframes.",
          color: "#f8fafc",
          accent: "#4fd1c5",
          textColor: "#f8fafc",
          width: 380,
          height: 180,
          x: 500,
          y: 190,
          keyframes: normalizeKeyframes([{ frame: 0, x: 560, y: 220, opacity: 0 }, { frame: 16, x: 500, y: 190, opacity: 1 }])
        }
      ];

  return {
    id: safeText(value?.id, `generated-template-${index + 1}`, 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    name: safeText(value?.name, `Generated template ${index + 1}`),
    description: safeText(value?.description, "API generated motion scene.", 140),
    source: "AI",
    frameCount: clampNumber(value?.frameCount, 72, 12, 240),
    fps: clampNumber(value?.fps, 12, 1, 60),
    background: safeText(value?.background, "linear-gradient(160deg, #10203b, #09111f)", 100),
    objects
  };
}

function buildFallbackAnimPack(prompt) {
  const text = safeText(prompt, "Launch campaign", 60);
  const isSpace = /space|cosmic|galaxy|orbit|star/i.test(text);
  const isEdu = /learn|course|lesson|class|school/i.test(text);
  const palette = isSpace
    ? { color: "#8b5cf6", accent: "#22d3ee", skin: "#ffd09a", background: "linear-gradient(160deg, #2a1455, #08111f)" }
    : isEdu
      ? { color: "#14b8a6", accent: "#c1fba4", skin: "#ffd09a", background: "linear-gradient(160deg, #173b3b, #0b1323)" }
      : { color: "#ff7b54", accent: "#ffd166", skin: "#ffd09a", background: "linear-gradient(160deg, #10203b, #09111f)" };

  return normalizeAnimPack({
    title: `${safeText(text, "Launch").replace(/(^\w)|(\s\w)/g, (m) => m.toUpperCase())} Pack`,
    elements: [
      { assetType: "blob", name: "Hero glow", description: `Hero blob for ${text}.`, label: "Launch", color: palette.color, accent: palette.accent, textColor: "#08111f", width: 260, height: 180 },
      { assetType: "window", name: "Demo frame", description: `UI showcase for ${text}.`, label: "Preview", color: "#38bdf8", accent: palette.accent, width: 300, height: 210 },
      { assetType: "burst", name: "Punch sticker", description: `Promo callout for ${text}.`, label: "NEW", color: palette.color, accent: palette.accent, width: 170, height: 170 }
    ],
    templates: [
      {
        name: `${safeText(text, "Launch")} opener`,
        description: `Pre-animated scene for ${text}.`,
        frameCount: 72,
        fps: 12,
        background: palette.background,
        objects: [
          { kind: "element", assetType: "blob", name: "Glow", label: "START", color: palette.color, accent: palette.accent, textColor: "#08111f", x: 220, y: 180, width: 280, height: 180, keyframes: [{ frame: 0, x: 120, y: 150, opacity: 0, scale: 0.8 }, { frame: 16, x: 220, y: 180, opacity: 1, scale: 1 }] },
          { kind: "element", assetType: "title", name: "Title", label: safeText(text, "Animate your story"), text: "Drag layers, keyframe motion, and pose your presenter.", color: "#f8fafc", accent: palette.accent, x: 520, y: 190, width: 390, height: 190, keyframes: [{ frame: 0, x: 570, y: 220, opacity: 0 }, { frame: 18, x: 520, y: 190, opacity: 1 }] },
          { kind: "character", name: "Guide", color: palette.color, accent: palette.accent, skin: palette.skin, x: 760, y: 380, width: 200, height: 290, pose: { rightArm: 40 }, keyframes: [{ frame: 0, x: 860, y: 400, opacity: 0, pose: { rightArm: 10, bounce: 10 } }, { frame: 20, x: 760, y: 380, opacity: 1, pose: { rightArm: 48, bounce: 0 } }] }
        ]
      }
    ],
    character: { name: `${safeText(text, "Studio")} host`, color: palette.color, accent: palette.accent, skin: palette.skin, pose: { rightArm: 40 } }
  });
}

function normalizeAnimPack(value) {
  const pack = value && typeof value === "object" ? value : {};
  return {
    title: safeText(pack.title, "Generated Animation Pack", 70),
    elements: (Array.isArray(pack.elements) && pack.elements.length ? pack.elements : [{}]).slice(0, 6).map((item, index) => normalizeElement(item, index)),
    templates: (Array.isArray(pack.templates) && pack.templates.length ? pack.templates : [{}]).slice(0, 4).map((item, index) => normalizeTemplate(item, index)),
    character: normalizeCharacter(pack.character || {})
  };
}

async function answerAnimStudio(payload) {
  const prompt = safeText(payload?.prompt, "", 180);
  if (!prompt) {
    return {
      status: 400,
      body: { message: "Prompt is required." }
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      status: 200,
      body: {
        provider: "local",
        fallback: true,
        pack: buildFallbackAnimPack(prompt)
      }
    };
  }

  const sceneSummary = Array.isArray(payload?.currentScene) ? payload.currentScene.slice(0, 6) : [];
  const model = process.env.GROQ_ANIMSTUDIO_MODEL || process.env.GROQ_HTML_ASSISTANT_MODEL || "llama-3.3-70b-versatile";
  const system = "You are an animation studio copilot. Return JSON only. Build a compact pack with keys: title, elements, templates, character. Allowed assetType values: blob, burst, window, title, ring, sticker, panel. Template objects can have kind element or character. Keep output concise and production friendly.";
  const user = `Prompt: ${prompt}\nProject: ${safeText(payload?.projectTitle, "Untitled project", 60)}\nCurrent scene summary: ${JSON.stringify(sceneSummary)}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    return {
      status: 200,
      body: {
        provider: "local",
        fallback: true,
        pack: buildFallbackAnimPack(prompt)
      }
    };
  }

  const content = String(data?.choices?.[0]?.message?.content || "").trim();
  const parsed = extractJsonPayload(content);
  if (!parsed) {
    return {
      status: 200,
      body: {
        provider: "local",
        fallback: true,
        pack: buildFallbackAnimPack(prompt)
      }
    };
  }

  return {
    status: 200,
    body: {
      provider: "groq",
      fallback: false,
      model: data?.model || model,
      pack: normalizeAnimPack(parsed)
    }
  };
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
const handleAnimStudioRequest = createHandler("POST", (payload) => answerAnimStudio(payload), true);
const handleHtmlAssistantStatusRequest = createHandler("GET", () => getHtmlAssistantStatus());
const handleHtmlAssistantRequest = createHandler("POST", (payload) => answerHtmlAssistant(payload), true);
const handleSignupRequest = createHandler("POST", (payload, req) => signup(payload, req), true);
const handleSigninRequest = createHandler("POST", (payload, req) => signin(payload, req), true);

module.exports = {
  applyCorsHeaders,
  handleAnimStudioRequest,
  handleHealthRequest,
  handleHtmlAssistantStatusRequest,
  handleHtmlAssistantRequest,
  handleSigninRequest,
  handleSignupRequest,
  sendJson
};
