import express from "express";
import path from "path";
import cors from "cors";
import { errorHandler } from "../common/middlewares/errorHandler.js";
import { logger } from "../common/config/logger.js";
import storefrontRouter from "./routes.js";
import { env } from "../common/config/env.js";
import { getDynamicCorsConfig } from "../common/config/index.js";

// Creates and configures Express application specifically for high-throughput Storefront customer traffic
export const createStorefrontApp = async () => {
  const app = express();

  app.set("wpTablePrefix", process.env.WP_TABLE_PREFIX || "wp_");
  app.set("trust proxy", true);

  const { allowedOrigins, clientKeywords } = getDynamicCorsConfig(env.ALLOWED_ORIGINS);

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowedExplicit = allowedOrigins.includes("*") || allowedOrigins.includes(origin);
      if (isAllowedExplicit) {
        return callback(null, true);
      }

      const isKnownClientDomain = clientKeywords.some((keyword) => origin.toLowerCase().includes(keyword));
      if (isKnownClientDomain) {
        return callback(null, true);
      }

      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/(.*)/, cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const staticAssetOptions = {
    setHeaders: (res, filePath) => {
      if (filePath.includes("assets")) {
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
      }
    },
  };

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), staticAssetOptions));
  app.use("/src/uploads", express.static(path.join(process.cwd(), "uploads"), staticAssetOptions));

  // Health check endpoint for storefront public API
  app.get("/", (req, res) => {
    res.json({
      status: "success",
      service: "Storefront API",
      message: "Storefront Customer API is live",
    });
  });

  app.use("/api/v1", storefrontRouter);

  app.use((req, res) => {
    res.status(404).json({ status: "error", message: "Resource not found" });
  });

  app.use(errorHandler);

  return app;
};
