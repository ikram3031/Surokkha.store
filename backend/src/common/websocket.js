import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { UserModel } from "./models/user.model.js";
import { MemberModel } from "./models/member.model.js";
import { LogModel } from "./models/log.model.js";

let wssInstance = null;
const authenticatedClients = new Set();

/**
 * Authenticate incoming WebSocket connection via token in query string or protocols
 */
async function authenticateWsConnection(req) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const token =
      url.searchParams.get("token") ||
      (req.headers["sec-websocket-protocol"] ? req.headers["sec-websocket-protocol"].split(",")[0].trim() : null) ||
      (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : null);

    if (!token) {
      return null;
    }

    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    const userId = payload.userId || payload.id || payload.sub;
    if (!userId) return null;

    let user = await UserModel.findById(userId).lean();
    if (!user) {
      user = await MemberModel.findById(userId).lean();
    }

    if (!user || user.isActive === false) return null;

    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      did: user.did,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    return null;
  }
}

// Initializes WebSocket server attached to HTTP server for notifications and real-time events
export const initWebSocketServer = (httpServer) => {
  const wss = new WebSocketServer({ noServer: true });
  wssInstance = wss;

  httpServer.on("upgrade", async (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (
      pathname === "/ws" ||
      pathname === "/ws/" ||
      pathname === "/ws/notifications" ||
      pathname === "/api/v1/ws/notifications" ||
      pathname.startsWith("/ws")
    ) {
      const user = await authenticateWsConnection(request);

      if (!user) {
        logger.warn({ ip: request.socket.remoteAddress, pathname }, "WebSocket connection rejected: unauthorized");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.user = user;
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", async (ws, req) => {
    authenticatedClients.add(ws);
    logger.info({ user: ws.user?.email }, "WebSocket client connected for live notifications");

    // Send initial notification snapshot upon connection
    try {
      const notificationFilter = { active: true, type: { $in: ["newOrder", "contactMessage", "webmailMessage"] } };
      const [topLogs, unreadCount] = await Promise.all([
        LogModel.find(notificationFilter).sort({ createdAt: -1 }).limit(10).lean(),
        LogModel.countDocuments({ ...notificationFilter, readStatus: false }),
      ]);

      ws.send(
        JSON.stringify({
          event: "INIT_NOTIFICATIONS",
          data: {
            notifications: topLogs.map((l) => ({ ...l, id: l._id?.toString?.() ?? l.id })),
            unreadCount,
          },
        })
      );
    } catch (err) {
      logger.error({ err }, "Failed to send initial WS notification state");
    }

    // Ping-pong heartbeat to keep alive
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());
        if (msg.event === "PING") {
          ws.send(JSON.stringify({ event: "PONG", timestamp: Date.now() }));
        }
      } catch {
        // Ignore unparseable client messages
      }
    });

    ws.on("close", () => {
      authenticatedClients.delete(ws);
      logger.debug({ user: ws.user?.email }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ err, user: ws.user?.email }, "WebSocket client error");
      authenticatedClients.delete(ws);
    });
  });

  // Heartbeat interval (30s)
  const interval = setInterval(() => {
    for (const ws of authenticatedClients) {
      if (ws.isAlive === false) {
        authenticatedClients.delete(ws);
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

/**
 * Broadcasts a live notification to all connected dashboard clients when a log is written
 */
export async function broadcastLiveNotification(logEntry) {
  if (!authenticatedClients.size) return;

  try {
    const unreadCount = await LogModel.countDocuments({
      active: true,
      type: { $in: ["newOrder", "contactMessage", "webmailMessage"] },
      readStatus: false,
    });

    const payload = JSON.stringify({
      event: "NEW_NOTIFICATION",
      data: {
        log: {
          id: logEntry._id?.toString?.() || logEntry.id || logEntry.did,
          did: logEntry.did,
          type: logEntry.type,
          typeDid: logEntry.typeDid,
          description: logEntry.description,
          readStatus: logEntry.readStatus ?? false,
          active: logEntry.active ?? true,
          createdBy: logEntry.createdBy,
          createdAt: logEntry.createdAt || new Date().toISOString(),
        },
        unreadCount,
      },
    });

    for (const client of authenticatedClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error broadcasting live notification over WebSocket");
  }
}

/**
 * Broadcast notification read status updates to all active clients
 */
export async function broadcastNotificationReadState(unreadCount) {
  if (!authenticatedClients.size) return;

  try {
    const payload = JSON.stringify({
      event: "NOTIFICATION_READ_UPDATE",
      data: {
        unreadCount,
      },
    });

    for (const client of authenticatedClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  } catch (err) {
    logger.error({ err }, "Error broadcasting read status over WebSocket");
  }
}
