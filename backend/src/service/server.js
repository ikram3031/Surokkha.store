import { createServiceApp } from "./app.js";
import { connectDatabase } from "../common/database/index.js";
import { env } from "../common/config/env.js";
import { logger } from "../common/config/logger.js";
import { createShutdownHandler } from "../common/helper/sutdownHelper.js";
import { initWebSocketServer } from "../common/websocket.js";
import { initMediaSchedulers, stopMediaSchedulers } from "../common/schedulers/mediaScheduler.js";
import { initHeartbeatScheduler, stopHeartbeatScheduler } from "../common/schedulers/heartbeat.scheduler.js";

// Bootstraps dedicated business logic dashboard and management API server instance
export const bootstrapService = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    logger.warn({ err: err.message }, "⚠️ MongoDB connection failed. Starting Service in offline/fallback mode...");
  }

  const app = await createServiceApp();
  const port = Number.parseInt(process.env.DASHBOARD_PORT ?? process.env.PORT ?? "4002", 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, role: "service", environment: env.NODE_ENV }, "Dashboard Service API listening");
  });

  const wss = initWebSocketServer(server);
  initMediaSchedulers();
  initHeartbeatScheduler();

  if (env.IMAP_SYNC_ENABLED) {
    import("../common/services/imapSync.service.js")
      .then(({ startImapIdleListener }) => {
        startImapIdleListener().catch((err) => {
          logger.error({ err }, "Failed to start IMAP IDLE listener");
        });
      })
      .catch((err) => {
        logger.error({ err }, "Could not load IMAP service");
      });
  }

  const shutdown = (signal) => {
    stopHeartbeatScheduler();
    stopMediaSchedulers();
    const handler = createShutdownHandler(server);
    return handler(signal);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Dashboard service uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Dashboard service unhandled rejection");
    void shutdown("unhandledRejection");
  });

  return server;
};

void bootstrapService();
