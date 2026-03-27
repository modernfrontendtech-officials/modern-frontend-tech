"use strict";

(function () {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (document.querySelector(".mft-ai-widget")) {
    return;
  }

  const CHAT_STORAGE_KEY = "mft_html_ai_chat_v2";
  const POSITION_STORAGE_KEY = "mft_html_ai_widget_position_v1";
  const OPEN_STORAGE_KEY = "mft_html_ai_widget_open_v1";
  const defaultButtonOffset = 24;

  const wrapper = document.createElement("div");
  wrapper.className = "mft-ai-widget";
  wrapper.innerHTML = `
    <button type="button" class="mft-ai-launcher" aria-expanded="false" aria-controls="mft-ai-panel">
      <span class="mft-ai-launcher-ring" aria-hidden="true"></span>
      <span class="mft-ai-launcher-avatar" aria-hidden="true">AI</span>
      <span class="mft-ai-launcher-copy">
        <strong>HTML AI</strong>
        <span>drag me</span>
      </span>
      <span class="mft-ai-launcher-dot" aria-hidden="true"></span>
    </button>
    <section class="mft-ai-panel" id="mft-ai-panel" hidden aria-label="HTML AI chat">
      <header class="mft-ai-panel-header">
        <div class="mft-ai-panel-identity">
          <div class="mft-ai-panel-avatar" aria-hidden="true">AI</div>
          <div>
            <strong>HTML Buddy</strong>
          </div>
        </div>
        <div class="mft-ai-panel-actions">
          <button type="button" class="secondary-action mft-ai-clear">new chat</button>
          <button type="button" class="secondary-action mft-ai-close" aria-label="Close chat">close</button>
        </div>
      </header>
      <div class="mft-ai-messages" role="log" aria-live="polite"></div>
      <form class="mft-ai-form">
        <label class="mft-ai-hidden-label" for="mft-ai-input">Message HTML AI</label>
        <textarea id="mft-ai-input" rows="3" maxlength="3000" placeholder="Ask about HTML tags, forms, tables, accessibility, debugging, or examples..."></textarea>
        <div class="mft-ai-form-row">
          <p class="mft-ai-status">Press Enter to send. Use Shift + Enter for a new line.</p>
          <button type="submit" class="mft-ai-send">send</button>
        </div>
      </form>
    </section>
  `;

  document.body.appendChild(wrapper);

  const launcher = wrapper.querySelector(".mft-ai-launcher");
  const launcherDot = wrapper.querySelector(".mft-ai-launcher-dot");
  const panel = wrapper.querySelector(".mft-ai-panel");
  const messages = wrapper.querySelector(".mft-ai-messages");
  const form = wrapper.querySelector(".mft-ai-form");
  const input = wrapper.querySelector("#mft-ai-input");
  const status = wrapper.querySelector(".mft-ai-status");
  const clearButton = wrapper.querySelector(".mft-ai-clear");
  const closeButton = wrapper.querySelector(".mft-ai-close");
  const sendButton = wrapper.querySelector(".mft-ai-send");
  const state = {
    open: readOpenState(),
    dragging: false,
    moved: false,
    pointerId: null,
    originX: 0,
    originY: 0,
    startLeft: 0,
    startTop: 0,
    apiState: "checking",
    chatHistory: readChatHistory()
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getViewportBounds() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  function saveChatHistory() {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state.chatHistory));
    } catch {
      status.textContent = "Chat is working, but browser storage is unavailable.";
    }
  }

  function readChatHistory() {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function readOpenState() {
    try {
      return localStorage.getItem(OPEN_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }

  function saveOpenState() {
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, String(state.open));
    } catch {
      return;
    }
  }

  function readSavedPosition() {
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.left !== "number" || typeof parsed?.top !== "number") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function savePosition(left, top) {
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ left, top }));
    } catch {
      return;
    }
  }

  function setDefaultPosition() {
    const viewport = getViewportBounds();
    const buttonWidth = launcher.offsetWidth || 172;
    const buttonHeight = launcher.offsetHeight || 64;
    const left = viewport.width - buttonWidth - defaultButtonOffset;
    const top = viewport.height - buttonHeight - defaultButtonOffset;
    moveLauncher(left, top, false);
  }

  function moveLauncher(left, top, persist = true) {
    const viewport = getViewportBounds();
    const buttonWidth = launcher.offsetWidth || 172;
    const buttonHeight = launcher.offsetHeight || 64;
    const clampedLeft = clamp(left, 12, viewport.width - buttonWidth - 12);
    const clampedTop = clamp(top, 12, viewport.height - buttonHeight - 12);

    launcher.style.left = `${clampedLeft}px`;
    launcher.style.top = `${clampedTop}px`;

    if (persist) {
      savePosition(clampedLeft, clampedTop);
    }

    positionPanel();
  }

  function restoreLauncherPosition() {
    const saved = readSavedPosition();
    if (!saved) {
      setDefaultPosition();
      return;
    }

    moveLauncher(saved.left, saved.top, false);
  }

  function positionPanel() {
    if (panel.hidden) {
      return;
    }

    const viewport = getViewportBounds();
    const isCompact = viewport.width <= 860;
    const panelWidth = isCompact
      ? viewport.width
      : Math.max(320, Math.round(viewport.width * 0.2));

    const left = isCompact ? 0 : viewport.width - panelWidth;

    panel.style.left = `${left}px`;
    panel.style.top = "0";
    panel.style.width = `${panelWidth}px`;
    panel.style.height = `${viewport.height}px`;
    panel.style.maxHeight = `${viewport.height}px`;
  }

  function setPanelOpen(isOpen) {
    state.open = isOpen;
    panel.hidden = !isOpen;
    launcher.setAttribute("aria-expanded", String(isOpen));
    wrapper.dataset.open = String(isOpen);
    saveOpenState();

    if (isOpen) {
      positionPanel();
      input.focus();
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTime(value) {
    try {
      return new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  function appendMessage(role, text, createdAt = new Date().toISOString()) {
    const article = document.createElement("article");
    article.className = role === "user"
      ? "mft-ai-message mft-ai-message-user"
      : "mft-ai-message mft-ai-message-assistant";

    article.innerHTML = `
      <div class="mft-ai-message-avatar" aria-hidden="true">${role === "user" ? "You" : "AI"}</div>
      <div class="mft-ai-message-bubble">
        <div class="mft-ai-message-meta">
          <span>${role === "user" ? "You" : "HTML AI"}</span>
          <time>${formatTime(createdAt)}</time>
        </div>
        <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
      </div>
    `;

    messages.appendChild(article);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderChatHistory() {
    messages.innerHTML = "";

    if (!state.chatHistory.length) {
      appendMessage("assistant", "Hey, I am your HTML study buddy. Ask me to explain tags, fix broken markup, or show examples and we will work through it together.");
      return;
    }

    state.chatHistory.forEach((message) => {
      const role = message.role === "user" ? "user" : "assistant";
      appendMessage(role, message.text, message.createdAt || new Date().toISOString());
    });
  }

  function setConnectionState(kind, text) {
    state.apiState = kind;
    wrapper.dataset.connection = kind;
    launcher.title = text;
    launcherDot.textContent = kind;
  }

  async function checkConnection() {
    setConnectionState("checking", "Checking API connection...");

    try {
      const response = await fetch("/api/html-assistant-status");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "The status route failed.");
      }

      if (!payload.htmlAssistantConfigured) {
        setConnectionState("offline", "AI is not configured on this deployment yet.");
        status.textContent = "The widget loaded, but the AI API key is missing.";
        return false;
      }

      setConnectionState("online", `Connected with ${payload.provider} / ${payload.htmlAssistantModel}.`);
      status.textContent = "HTML AI is ready.";
      return true;
    } catch (error) {
      setConnectionState("offline", error.message || "The AI route could not be reached.");
      status.textContent = "The AI connection check failed.";
      return false;
    }
  }

  async function askAssistant(question) {
    const sentAt = new Date().toISOString();
    appendMessage("user", question, sentAt);
    state.chatHistory.push({ role: "user", text: question, createdAt: sentAt });
    saveChatHistory();
    status.textContent = "HTML AI is thinking...";
    sendButton.disabled = true;
    input.disabled = true;

    try {
      const response = await fetch("/api/html-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          history: state.chatHistory.slice(-12)
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "The HTML assistant could not answer right now.");
      }

      const repliedAt = new Date().toISOString();
      appendMessage("assistant", payload.answer, repliedAt);
      state.chatHistory.push({ role: "assistant", text: payload.answer, createdAt: repliedAt });
      saveChatHistory();
      status.textContent = payload.model ? `Replied with ${payload.model}.` : "Reply received.";
      setConnectionState("online", payload.model ? `Connected with ${payload.provider} / ${payload.model}.` : "API connected.");
    } catch (error) {
      const failedReply = error.message || "Something went wrong while calling the HTML assistant.";
      const failedAt = new Date().toISOString();
      appendMessage("assistant", failedReply, failedAt);
      state.chatHistory.push({ role: "assistant", text: failedReply, createdAt: failedAt });
      saveChatHistory();
      status.textContent = "The message failed.";
      setConnectionState("offline", error.message || "The AI request failed.");
    } finally {
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  function onPointerMove(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) {
      return;
    }

    const deltaX = event.clientX - state.originX;
    const deltaY = event.clientY - state.originY;

    if (!state.moved && Math.hypot(deltaX, deltaY) > 8) {
      state.moved = true;
      launcher.classList.add("is-dragging");
    }

    moveLauncher(state.startLeft + deltaX, state.startTop + deltaY);
  }

  function finishPointer(event) {
    if (event.pointerId !== state.pointerId) {
      return;
    }

    launcher.releasePointerCapture(event.pointerId);
    launcher.classList.remove("is-dragging");
    state.dragging = false;

    const wasMoved = state.moved;
    state.moved = false;
    state.pointerId = null;

    if (!wasMoved) {
      setPanelOpen(panel.hidden);
    }
  }

  function bindPressAction(element, handler) {
    let lastHandledAt = 0;

    function invoke(event) {
      const now = Date.now();
      if (now - lastHandledAt < 250) {
        return;
      }

      lastHandledAt = now;
      event.preventDefault();
      event.stopPropagation();
      handler();
    }

    element.addEventListener("click", invoke);
    element.addEventListener("pointerup", (event) => {
      if (event.pointerType === "mouse") {
        return;
      }

      invoke(event);
    });
  }

  launcher.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") {
      return;
    }

    state.dragging = true;
    state.moved = false;
    state.pointerId = event.pointerId;
    state.originX = event.clientX;
    state.originY = event.clientY;

    const rect = launcher.getBoundingClientRect();
    state.startLeft = rect.left;
    state.startTop = rect.top;

    launcher.setPointerCapture(event.pointerId);
  });

  launcher.addEventListener("pointermove", onPointerMove);
  launcher.addEventListener("pointerup", finishPointer);
  launcher.addEventListener("pointercancel", finishPointer);

  bindPressAction(closeButton, () => {
    setPanelOpen(false);
  });

  panel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  bindPressAction(clearButton, () => {
    state.chatHistory = [];
    saveChatHistory();
    renderChatHistory();
    status.textContent = "Started a fresh chat.";
    input.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();

    if (!question) {
      status.textContent = "Please enter an HTML question first.";
      input.focus();
      return;
    }

    input.value = "";
    await askAssistant(question);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) {
      setPanelOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    restoreLauncherPosition();
    positionPanel();
  });

  renderChatHistory();
  restoreLauncherPosition();
  setPanelOpen(state.open);
  checkConnection();
})();
