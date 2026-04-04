const express = require("express");
const path = require("node:path");
const {
  applyCorsHeaders,
  handleHealthRequest,
  handleHtmlAssistantRequest,
  handleHtmlAssistantStatusRequest,
  handleProfileActivityRequest,
  handleProfileRequest,
  handleSigninRequest,
  handleSignupRequest,
  sendJson
} = require("./lib/api-handlers");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.all("/api/health", handleHealthRequest);
app.all("/api/html-assistant-status", handleHtmlAssistantStatusRequest);
app.all("/api/html-assistant", handleHtmlAssistantRequest);
app.all("/api/signup", handleSignupRequest);
app.all("/api/signin", handleSigninRequest);
app.all("/api/profile", handleProfileRequest);
app.all("/api/profile-activity", handleProfileActivityRequest);

app.use(express.static(path.join(__dirname)));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    applyCorsHeaders(req, res);
    return sendJson(res, 400, { message: "Invalid JSON payload." });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Vercel-compatible API routes are available at /api/health, /api/html-assistant-status, /api/html-assistant, /api/signup, /api/signin, /api/profile, and /api/profile-activity");
});
