import { createStorefrontApp } from "./storefront/app.js";
import { createServiceApp } from "./service/app.js";
import { connectDatabase } from "./common/database/index.js";
import { env } from "./common/config/env.js";
import { logger } from "./common/config/logger.js";
import { createShutdownHandler } from "./common/helper/sutdownHelper.js";
import { initWebSocketServer } from "./common/websocket.js";
import { initMediaSchedulers, stopMediaSchedulers } from "./common/schedulers/mediaScheduler.js";
import { initHeartbeatScheduler, stopHeartbeatScheduler } from "./common/schedulers/heartbeat.scheduler.js";

// Bootstraps backend server instances (Storefront on 4001, Service on 4002, or both in dual mode)
const bootstrap = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    logger.warn({ err: err.message }, "⚠️ MongoDB connection failed. Starting HTTP servers in offline/fallback mode...");
  }

  const role = (process.env.APP_ROLE || "all").toLowerCase();
  const servers = [];

  if (role === "storefront") {
    // 1. Dedicated Storefront instance
    const storefrontApp = await createStorefrontApp();
    const port = Number.parseInt(process.env.STOREFRONT_PORT ?? process.env.PORT ?? "4001", 10);
    const server = storefrontApp.listen(port, "0.0.0.0", () => {
      logger.info({ port, role: "storefront", environment: env.NODE_ENV }, `Storefront API server listening on http://localhost:${port}`);
    });
    servers.push(server);
  } else if (role === "service" || role === "dashboard") {
    // 2. Dedicated Service / Dashboard API instance
    const serviceApp = await createServiceApp();
    const port = Number.parseInt(process.env.SERVICE_PORT ?? process.env.DASHBOARD_PORT ?? process.env.PORT ?? "4002", 10);
    const server = serviceApp.listen(port, "0.0.0.0", () => {
      logger.info({ port, role: "service", environment: env.NODE_ENV }, `Service API server listening on http://localhost:${port}`);
    });
    servers.push(server);

    initWebSocketServer(server);
    initMediaSchedulers();
    initHeartbeatScheduler();

    if (env.IMAP_SYNC_ENABLED) {
      import("./common/services/imapSync.service.js")
        .then(({ startImapIdleListener }) => {
          startImapIdleListener().catch((err) => {
            logger.error({ err }, "Failed to start IMAP IDLE listener");
          });
        })
        .catch((err) => {
          logger.error({ err }, "Could not load IMAP service");
        });
    }
  } else {
    // 3. Default Dual Mode (npm run dev): Run BOTH Storefront (4001) and Service (4002) simultaneously
    const storefrontApp = await createStorefrontApp();
    const storefrontPort = Number.parseInt(process.env.STOREFRONT_PORT ?? "4001", 10);
    const storefrontServer = storefrontApp.listen(storefrontPort, "0.0.0.0", () => {
      logger.info({ port: storefrontPort, role: "storefront", environment: env.NODE_ENV }, `🚀 [Storefront API] listening on http://localhost:${storefrontPort} (Customer routes)`);
    });
    servers.push(storefrontServer);

    const serviceApp = await createServiceApp();
    const servicePort = Number.parseInt(process.env.SERVICE_PORT ?? process.env.DASHBOARD_PORT ?? "4002", 10);
    const serviceServer = serviceApp.listen(servicePort, "0.0.0.0", () => {
      logger.info({ port: servicePort, role: "service", environment: env.NODE_ENV }, `🚀 [Service API] listening on http://localhost:${servicePort} (Dashboard routes & WebSockets)`);
    });
    servers.push(serviceServer);

    initWebSocketServer(serviceServer);
    initMediaSchedulers();
    initHeartbeatScheduler();

    if (env.IMAP_SYNC_ENABLED) {
      import("./common/services/imapSync.service.js")
        .then(({ startImapIdleListener }) => {
          startImapIdleListener().catch((err) => {
            logger.error({ err }, "Failed to start IMAP IDLE listener");
          });
        })
        .catch((err) => {
          logger.error({ err }, "Could not load IMAP service");
        });
    }
  }

  const shutdown = (signal) => {
    stopHeartbeatScheduler();
    stopMediaSchedulers();
    servers.forEach((srv) => {
      const handler = createShutdownHandler(srv);
      handler(signal);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled rejection");
    void shutdown("unhandledRejection");
  });
};

void bootstrap();

