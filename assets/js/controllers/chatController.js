import { askPropertyAssistant, clearChatHistory, getChatHistory, getQuickPromptLabels } from "../services/chatAssistantService.js";
import { escapeHtml, showToast } from "../views/templates.js";

export function renderAiChatAssistant() {
  if (document.querySelector("#aiChatWidget")) return;

  const chatShell = document.createElement("section");
  chatShell.className = "ai-chat-widget";
  chatShell.id = "aiChatWidget";
  chatShell.setAttribute("aria-label", "AI property assistant");
  chatShell.innerHTML = `
    <button class="ai-chat-launcher" id="aiChatLauncher" type="button" aria-expanded="false">
      <i class="bi bi-chat-dots-fill"></i>
      <span>Property Assistant</span>
    </button>
    <div class="ai-chat-panel" id="aiChatPanel" hidden>
      <div class="ai-chat-header">
        <div>
          <div class="fw-bold">Estate Property Assistant</div>
          <div class="small text-white-50">Rule-based guidance from demo listings</div>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-light" id="clearAiChat" type="button" aria-label="Clear chat"><i class="bi bi-trash"></i></button>
          <button class="btn btn-sm btn-outline-light" id="closeAiChat" type="button" aria-label="Close chat"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>
      <div class="ai-chat-messages" id="aiChatMessages"></div>
      <div class="ai-chat-prompts">
        ${getQuickPromptLabels().map((promptLabel) => `
          <button class="btn btn-sm btn-outline-secondary" data-chat-prompt="${escapeHtml(promptLabel)}" type="button">${escapeHtml(promptLabel)}</button>
        `).join("")}
      </div>
      <form class="ai-chat-form" id="aiChatForm">
        <input aria-label="Ask the property assistant" class="form-control" id="aiChatInput" placeholder="Ask about budget, risk, comparison..." autocomplete="off">
        <button class="btn btn-primary" type="submit" aria-label="Send message"><i class="bi bi-send"></i></button>
      </form>
    </div>
  `;

  document.body.appendChild(chatShell);
  bindChatEvents(chatShell);
  renderMessages(chatShell);
}

function bindChatEvents(chatShell) {
  const launcherButton = chatShell.querySelector("#aiChatLauncher");
  const panelElement = chatShell.querySelector("#aiChatPanel");
  const chatForm = chatShell.querySelector("#aiChatForm");
  const chatInput = chatShell.querySelector("#aiChatInput");

  launcherButton.addEventListener("click", () => {
    const shouldOpen = panelElement.hasAttribute("hidden");
    panelElement.toggleAttribute("hidden", !shouldOpen);
    launcherButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) chatInput.focus();
  });

  chatShell.querySelector("#closeAiChat").addEventListener("click", () => {
    panelElement.setAttribute("hidden", "");
    launcherButton.setAttribute("aria-expanded", "false");
  });

  chatShell.querySelector("#clearAiChat").addEventListener("click", () => {
    clearChatHistory();
    renderMessages(chatShell);
    showToast("AI chat cleared.", "secondary");
  });

  chatShell.querySelectorAll("[data-chat-prompt]").forEach((promptButton) => {
    promptButton.addEventListener("click", () => {
      chatInput.value = promptButton.dataset.chatPrompt;
      submitChatQuestion(chatShell);
    });
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitChatQuestion(chatShell);
  });
}

function submitChatQuestion(chatShell) {
  const chatInput = chatShell.querySelector("#aiChatInput");
  const message = chatInput.value.trim();

  try {
    const reply = askPropertyAssistant(message);
    chatInput.value = "";
    renderMessages(chatShell);
    if (reply.action?.type === "navigate") {
      location.hash = reply.action.href;
      showToast("AI updated the discovery filters.", "success");
    }
  } catch (error) {
    showToast(error.message, "warning");
  }
}

function renderMessages(chatShell) {
  const messagesElement = chatShell.querySelector("#aiChatMessages");
  const chatHistory = getChatHistory();

  if (!chatHistory.length) {
    messagesElement.innerHTML = `
      <div class="ai-message assistant">
        <div class="ai-message-label">Assistant</div>
        <div>I can recommend homes, explain EMI comfort, compare selected properties, and flag buyer risks using this portal's listing data.</div>
      </div>
    `;
    return;
  }

  messagesElement.innerHTML = chatHistory.map((chatMessage) => renderChatMessage(chatMessage)).join("");
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

function renderChatMessage(chatMessage) {
  const links = chatMessage.links?.length ? `
    <div class="ai-message-links">
      ${chatMessage.links.map((messageLink) => `
        <a class="btn btn-sm btn-light" href="${messageLink.href}">${escapeHtml(messageLink.label)}</a>
      `).join("")}
    </div>
  ` : "";

  return `
    <div class="ai-message ${chatMessage.role === "user" ? "user" : "assistant"}">
      <div class="ai-message-label">${chatMessage.role === "user" ? "You" : "Assistant"}</div>
      <div>${formatChatText(chatMessage.text)}</div>
      ${links}
    </div>
  `;
}

function formatChatText(messageText) {
  return escapeHtml(messageText).replaceAll("\n", "<br>");
}
