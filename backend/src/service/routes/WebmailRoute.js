import { Router } from "express";
import {
  listWebmailMessages,
  getWebmailMessageById,
  sendWebmailMessage,
  triggerManualSync,
  updateMessageFlags,
  batchWebmailAction,
  deleteWebmailMessage,
  getWebmailFolders,
} from "../controllers/WebmailController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../common/middlewares/auth.middleware.js";

const webmailRouter = Router();

const adminAuth = [
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Super Admin"),
];

webmailRouter.get("/folders", ...adminAuth, getWebmailFolders);
webmailRouter.get("/messages", ...adminAuth, listWebmailMessages);
webmailRouter.post("/messages/batch", ...adminAuth, batchWebmailAction);
webmailRouter.get("/messages/:id", ...adminAuth, getWebmailMessageById);
webmailRouter.post("/send", ...adminAuth, sendWebmailMessage);
webmailRouter.post("/sync", ...adminAuth, triggerManualSync);
webmailRouter.patch("/messages/:id/flags", ...adminAuth, updateMessageFlags);
webmailRouter.delete("/messages/:id", ...adminAuth, deleteWebmailMessage);

export default webmailRouter;
