import { createStoreWebApp } from "./app.js";
import { connectDatabase } from "../common/database/index.js";
import { env } from "../common/config/env.js";
import { logger } from "../common/config/logger.js";
import { createShutdownHandler } from "../common/helper/sutdownHelper.js";

// Bootstraps dedicated high-throughput storeWeb customer API server instance
export const bootstrapStoreWeb = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    logger.warn({ err: err.message }, "⚠️ MongoDB connection failed. Starting StoreWeb in offline/fallback mode...");
  }

  const app = await createStoreWebApp();
  const port = Number.parseInt(process.env.STOREWEB_PORT ?? process.env.PORT ?? "4001", 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, role: "storeWeb", environment: env.NODE_ENV }, "StoreWeb API server listening");
  });

  const shutdown = (signal) => {
    const handler = createShutdownHandler(server);
    return handler(signal);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "StoreWeb uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "StoreWeb unhandled rejection");
    void shutdown("unhandledRejection");
  });

  return server;
};

void bootstrapStoreWeb();
