require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function buildInput(history, message) {
  const safeHistory = Array.isArray(history) ? history.slice(-12) : [];

  const input = [
    {
      role: "system",
      content:
        "You are an expert HTML tutor. Answer HTML questions clearly with examples when useful. If the topic is not HTML, politely redirect to HTML."
    }
  ];

  for (const item of safeHistory) {
    if (!item || !item.role || !item.content) continue;
    if (item.role !== "user" && item.role !== "assistant") continue;
    input.push({ role: item.role, content: String(item.content) });
  }

  input.push({ role: "user", content: message });
  return input;
}

function extractText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    const parts = [];
    for (const block of data.output) {
      if (!Array.isArray(block.content)) continue;
      for (const part of block.content) {
        if (part.type === "output_text" && part.text) parts.push(part.text);
      }
    }
    if (parts.length) return parts.join("\n").trim();
  }

  return "No text response returned by the model.";
}

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing on server. Add it to .env file."
      });
    }

    const message = String(req.body?.message || "").trim();
    const history = req.body?.history;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: buildInput(history, message)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Model request failed.";
      return res.status(response.status).json({ error: message });
    }

    return res.json({ reply: extractText(data) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
