import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import { errorHandler } from "../common/middlewares/errorHandler.js";
import { authenticateToken, authorizeRoles } from "../common/middlewares/auth.middleware.js";
import { logger } from "../common/config/logger.js";
import serviceRouter from "./routes.js";
import swaggerRouter from "./routes/SwaggerRoute.js";
import { env } from "../common/config/env.js";
import { getDynamicCorsConfig } from "../common/config/index.js";

// Creates and configures Express application specifically for Dashboard & Admin Business Service
export const createServiceApp = async () => {
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

  // Health check endpoint for Dashboard Service API
  app.get("/", (req, res) => {
    res.json({
      status: "success",
      service: "Dashboard Business Service API (v2)",
      message: "Dashboard Business Service API is live",
      documentation: {
        swaggerUI: "/api-docs",
        openApiJson: "/api/v2/swagger.json",
      },
    });
  });

  app.use("/api-docs", swaggerRouter);
  app.use("/docs", swaggerRouter);
  app.use("/swagger", swaggerRouter);
  app.use("/api/v2/docs", swaggerRouter);
  app.use("/api/v2/swagger", swaggerRouter);
  app.use("/api/v1/docs", swaggerRouter);
  app.use("/api/v1/swagger", swaggerRouter);
  app.get("/swagger.json", (req, res) => res.redirect("/api-docs/swagger.json"));
  app.get("/api/v2/swagger.json", (req, res) => res.redirect("/api-docs/swagger.json"));
  app.get("/api/v1/swagger.json", (req, res) => res.redirect("/api-docs/swagger.json"));

  // Primary Dashboard Service router mounted at /api/v2
  app.use("/api/v2", serviceRouter);
  // Alias /api/v1 for backward compatibility
  app.use("/api/v1", serviceRouter);

  // Version inspection endpoint for authenticated administrators
  const getVersionHandler = (req, res) => {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
      res.json({ status: "success", version: packageJson.version });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Could not read version" });
    }
  };

  app.get("/api/v2/version", authenticateToken, authorizeRoles("Owner", "Admin"), getVersionHandler);
  app.get("/api/v1/version", authenticateToken, authorizeRoles("Owner", "Admin"), getVersionHandler);

  app.use((req, res) => {
    res.status(404).json({ status: "error", message: "Resource not found" });
  });

  app.use(errorHandler);

  return app;
};
