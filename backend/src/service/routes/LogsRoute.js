import { Router } from "express";
import {
  listLogs,
  getNotificationLogs,
  createLog,
  markLogsRead,
  markLogsUnread,
  deleteLog,
  bulkDeleteLogs,
} from "../controllers/LogsController.js";
import { authenticateToken, authorizeRoles, OWNER_ONLY, ADMINS, ALL_STAFF } from "../../common/middlewares/auth.middleware.js";

const logsRouter = Router();

// All logs routes require authentication
logsRouter.use(authenticateToken, authorizeRoles(ALL_STAFF));

// 1. Get top 5 newOrder notifications & unread count
logsRouter.get("/notifications", getNotificationLogs);

// 2. Mark logs as read
logsRouter.put("/mark-read", markLogsRead);

// 3. Mark logs as unread
logsRouter.put("/mark-unread", markLogsUnread);

// 4. Bulk soft delete logs
logsRouter.post("/bulk-delete", authorizeRoles(OWNER_ONLY), bulkDeleteLogs);

// 5. List all active logs (with pagination & search)
logsRouter.get("/", authorizeRoles(ADMINS), listLogs);

// 6. Create a log entry
logsRouter.post("/", createLog);

// 7. Soft delete a single log
logsRouter.delete("/:id", authorizeRoles(OWNER_ONLY), deleteLog);

export default logsRouter;
