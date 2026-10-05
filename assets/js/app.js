import { renderAiChatAssistant } from "./controllers/chatController.js";
import { startRouter } from "./routes/router.js";
import { renderAccountActions } from "./controllers/authController.js";
import { seedInitialRecords } from "./services/storageService.js";

seedInitialRecords();
renderAccountActions();
renderAiChatAssistant();
startRouter();

window.addEventListener("hashchange", renderAccountActions);
