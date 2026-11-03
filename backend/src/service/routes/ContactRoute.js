import { Router } from "express";
import {
  submitContact,
  listMessages,
  getMessageById,
  replyToMessage,
  updateMessageStatus,
  deleteMessage,
  bulkDeleteMessages,
} from "../controllers/ContactController.js";
import { authenticateToken, authorizeRoles, MANAGERS } from "../../common/middlewares/auth.middleware.js";

const router = Router();

// Public storefront contact submission
router.post("/", submitContact);

// Admin Messages Endpoints (Owner, Admin, Manager)
const adminAuth = [
  authenticateToken,
  authorizeRoles(MANAGERS),
];

router.get("/messages", ...adminAuth, listMessages);
router.post("/messages/bulk-delete", ...adminAuth, bulkDeleteMessages);
router.get("/messages/:id", ...adminAuth, getMessageById);
router.post("/messages/:id/reply", ...adminAuth, replyToMessage);
router.patch("/messages/:id/status", ...adminAuth, updateMessageStatus);
router.delete("/messages/:id", ...adminAuth, deleteMessage);

export default router;

