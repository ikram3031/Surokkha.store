import { Router } from "express";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";

const developerRouter = Router();

// Verifies developer or authorized administrative staff access
const verifyDeveloperAccess = (req, res, next) => {
  const userEmail = req.user?.email ? String(req.user.email).toLowerCase().trim() : "";
  const userRole = req.user?.role ? String(req.user.role).toLowerCase().trim() : "";
  const allowedRoles = ["owner", "admin", "manager", "developer"];

  if (userEmail === "ikramul.web@gmail.com" || userEmail === "ihkhan2027@gmail.com" || allowedRoles.includes(userRole)) {
    return next();
  }

  return res.status(403).json({
    status: "error",
    message: "Forbidden: You do not have permission to perform this action.",
  });
};

// In-memory buffer of recent logs for SSE & polling
export const recentLogsBuffer = [];
export const logClients = new Set();

export function broadcastLogToClients(logEntry) {
  recentLogsBuffer.push(logEntry);
  if (recentLogsBuffer.length > 300) {
    recentLogsBuffer.shift();
  }
  for (const clientRes of logClients) {
    clientRes.write(`data: ${JSON.stringify(logEntry)}\n\n`);
  }
}

// GET /api/v1/developer/logs (Polling JSON fallback)
developerRouter.get(
  "/logs",
  authenticateToken,
  verifyDeveloperAccess,
  (req, res) => {
    return res.json({
      status: "success",
      data: recentLogsBuffer,
    });
  }
);

// GET /api/v1/developer/logs/stream (Realtime SSE Stream)
developerRouter.get(
  "/logs/stream",
  authenticateToken,
  verifyDeveloperAccess,
  (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send initial buffer
    res.write(`data: ${JSON.stringify({ type: "INIT", logs: recentLogsBuffer })}\n\n`);

    logClients.add(res);

    req.on("close", () => {
      logClients.delete(res);
    });
  }
);

// GET /api/v1/developer/docs (Scalar API Reference View - Stripe/Vercel Style)
import { swaggerSpec } from "../../common/docs/swaggerSpec.js";

developerRouter.get(
  "/docs",
  (req, res) => {
    const scalarHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Decantre API Documentation (Scalar)</title>
  <style>
    body { margin: 0; padding: 0; background: #0f172a; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <script id="api-reference" type="application/json">
    ${JSON.stringify(swaggerSpec)}
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(scalarHtml);
  }
);

// GET /api/v1/developer/db-backup (Compressed MongoDB Database Backup)
import mongoose from "mongoose";
import zlib from "node:zlib";

developerRouter.get(
  "/db-backup",
  authenticateToken,
  verifyDeveloperAccess,
  async (req, res, next) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        return res.status(500).json({
          status: "error",
          message: "Database connection not established",
        });
      }

      // Get all collections in the database
      const collections = await db.listCollections().toArray();
      const backupData = {};

      for (const col of collections) {
        const name = col.name;
        // Skip system collections
        if (name.startsWith("system.")) continue;
        const docs = await db.collection(name).find({}).toArray();
        backupData[name] = docs;
      }

      const jsonStr = JSON.stringify(backupData, null, 2);

      // Gzip compress the JSON string
      zlib.gzip(jsonStr, (err, buffer) => {
        if (err) {
          console.error("Gzip compression failed:", err);
          return res.status(500).json({
            status: "error",
            message: "Failed to compress database backup",
          });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `mongodb_backup_${timestamp}.json.gz`;

        res.setHeader("Content-disposition", `attachment; filename=${filename}`);
        res.setHeader("Content-Type", "application/gzip");
        res.send(buffer);
      });
    } catch (error) {
      console.error("Database backup export failed:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to export database collections",
      });
    }
  }
);

export default developerRouter;
