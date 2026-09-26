import mongoose from "mongoose";
import os from "os";
import { config } from "../config/index.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let heartbeatTimer = null;

// Collects telemetry payload from the current running runtime
const collectTelemetryData = () => {
  const mem = process.memoryUsage();
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const uptimeSeconds = process.uptime();

  return {
    clientKey: config.clientKey || "decantre",
    brandName: config.brandName || "Decantre",
    domain: config.domain || "",
    vpsIp: env.VPS_IP || process.env.VPS_IP || "auto-detect",
    environment: env.NODE_ENV,
    apiBaseUrl: config.apiBaseUrl || "",
    dashboardUrl: config.dashboardUrl || "",
    storefrontUrl: config.storefrontUrl || "",
    policies: config.policies || {
      stock: { mode: "product_wise" },
      pricing: { mode: "variable" },
    },
    system: {
      uptimeSeconds: Math.round(uptimeSeconds),
      uptimeHours: +(uptimeSeconds / 3600).toFixed(2),
      memoryRssMb: +(mem.rss / (1024 * 1024)).toFixed(2),
      memoryHeapUsedMb: +(mem.heapUsed / (1024 * 1024)).toFixed(2),
      dbStatus,
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`,
    },
    timestamp: new Date().toISOString(),
  };
};

// Sends non-blocking telemetry heartbeat payload to the Central Cloudflare Hub
export const sendHeartbeat = async () => {
  const hubUrl = env.CENTRAL_HUB_URL || process.env.CENTRAL_HUB_URL;
  if (!hubUrl) {
    // Silently skip if central hub URL is not configured
    return;
  }

  try {
    const payload = collectTelemetryData();
    const endpoint = hubUrl.endsWith("/api/v1/heartbeat") ? hubUrl : `${hubUrl.replace(/\/+$/, "")}/api/v1/heartbeat`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-secret": env.CENTRAL_HUB_SECRET || "wlecom-fleet-secret",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn({ status: response.status }, "[Heartbeat] Central Hub returned non-200 status");
    }
  } catch (err) {
    // Non-blocking telemetry — ignore aborts and network timeouts
    logger.debug({ error: err.message }, "[Heartbeat] Could not reach Central Hub");
  }
};

// Initializes and starts recurring background telemetry heartbeat timer
export const initHeartbeatScheduler = () => {
  const intervalMinutes = 2;
  const intervalMs = intervalMinutes * 60 * 1000;

  // Initial heartbeat after 15 seconds of boot
  setTimeout(() => {
    sendHeartbeat().catch((err) => {
      logger.debug({ err: err.message }, "[Heartbeat] Initial heartbeat error");
    });
  }, 15 * 1000);

  // Periodic recurring heartbeat
  heartbeatTimer = setInterval(() => {
    sendHeartbeat().catch((err) => {
      logger.debug({ err: err.message }, "[Heartbeat] Recurring heartbeat error");
    });
  }, intervalMs);

  logger.info({ intervalMinutes }, "[Heartbeat] Background telemetry heartbeat initialized");
};

// Stops the recurring background telemetry heartbeat timer
export const stopHeartbeatScheduler = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  logger.info("[Heartbeat] Background telemetry heartbeat stopped");
};
