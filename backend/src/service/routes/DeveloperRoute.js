import { Router } from "express";
import { authenticateToken, authorizeRoles, acceptQueryToken, OWNER_ONLY } from "../../common/middlewares/auth.middleware.js";
import { getClientIp } from "../../common/utils/clientIp.js";

const developerRouter = Router();

const ownerOnly = [authenticateToken, authorizeRoles(OWNER_ONLY)];

// Credentials and session secrets never leave the database in a backup
const SECRET_FIELDS = ["passwordHash", "refreshTokens", "twoFactorSecret", "emailOtp", "emailOtpExpiresAt", "inviteToken", "inviteTokenExpiresAt"];

const stripSecretFields = (doc) => {
  const clean = { ...doc };
  SECRET_FIELDS.forEach((field) => delete clean[field]);
  return clean;
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

// GET /api/v1/developer/my-ip (the caller's own IP, so the logs page can tag it)
developerRouter.get(
  "/my-ip",
  ...ownerOnly,
  (req, res) => res.json({ status: "success", data: { ip: getClientIp(req) } })
);

// GET /api/v1/developer/logs (Polling JSON fallback)
developerRouter.get(
  "/logs",
  ...ownerOnly,
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
  acceptQueryToken,
  ...ownerOnly,
  (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Stop nginx/Cloudflare from buffering the stream, which stalls events until the buffer fills
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial buffer
    res.write(`data: ${JSON.stringify({ type: "INIT", logs: recentLogsBuffer })}\n\n`);

    logClients.add(res);

    // Keep-alive comment so idle proxies don't drop the connection
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      logClients.delete(res);
    });
  }
);

// GET /api/v1/developer/docs (Scalar API Reference View - Stripe/Vercel Style)
import { swaggerSpec } from "../../common/docs/swaggerSpec.js";

developerRouter.get(
  "/docs",
  acceptQueryToken,
  ...ownerOnly,
  (req, res) => {
    const scalarHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation (Scalar)</title>
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
  ...ownerOnly,
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
        backupData[name] = docs.map(stripSecretFields);
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
