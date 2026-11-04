import { Router } from "express";
import {
  requireSupportConfigured,
  rawAttachmentBody,
  listTickets,
  createTicket,
  getTicket,
  replyToTicket,
  uploadAttachment,
} from "../controllers/SupportController.js";
import { authenticateToken, authorizeRoles, MANAGERS } from "../../common/middlewares/auth.middleware.js";

const router = Router();

// Dashboard staff only; closed with a 503 while PLEXIVIA_SUPPORT_KEY is unset
router.use(authenticateToken, authorizeRoles(MANAGERS), requireSupportConfigured);

router.get("/tickets", listTickets);
router.post("/tickets", createTicket);
router.get("/tickets/:id", getTicket);
router.post("/tickets/:id/messages", replyToTicket);
// Raw bytes (not multipart); the body parser runs only after auth so anonymous callers never get buffered
router.post("/attachments", rawAttachmentBody, uploadAttachment);

export default router;
