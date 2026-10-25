import { env } from "../config/env.js";
import { broadcastLogToClients } from "../../service/routes/DeveloperRoute.js";

// Formats transfer byte size
const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Detects whether a request came from the dashboard, the storefront or somewhere else
const getRequestSource = (req, config = {}) => {
  const origin = (req.headers["origin"] || req.headers["referer"] || "").toLowerCase();

  const dashboardKeywords = env.DASHBOARD_DOMAIN_KEYWORDS
    ? env.DASHBOARD_DOMAIN_KEYWORDS.split(",").map((kw) => kw.trim().toLowerCase())
    : ["dashboard"];
  const frontendKeywords = env.FRONTEND_DOMAIN_KEYWORDS
    ? env.FRONTEND_DOMAIN_KEYWORDS.split(",").map((kw) => kw.trim().toLowerCase())
    : ["localhost", config.domain || "example.com"];

  const isDashboard = dashboardKeywords.some((kw) => origin.includes(kw)) ||
    (req.originalUrl && req.originalUrl.includes("/dashboard/"));
  if (isDashboard) return "DASHBOARD";

  if (frontendKeywords.some((kw) => origin.includes(kw))) return "FRONTEND";
  return "EXTERNAL";
};

// Logs every API request to the console and pushes it to the live System Logs stream
export const createRequestLogger = (config = {}) => (req, res, next) => {
  // Ignore the log endpoints themselves to prevent feedback loops
  if (req.originalUrl && req.originalUrl.startsWith("/api/v1/developer/logs")) {
    return next();
  }

  const startTime = process.hrtime();

  const cfConnectingIp = req.headers["cf-connecting-ip"];
  const xRealIp = req.headers["x-real-ip"];
  const xForwardedFor = req.headers["x-forwarded-for"];
  const clientIp = cfConnectingIp || xRealIp || (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) || req.ip || req.socket?.remoteAddress || "Unknown IP";

  const source = getRequestSource(req, config);
  const requestDate = new Date();
  const now = requestDate.toLocaleTimeString("en-US", { hour12: false });
  const isoTimestamp = requestDate.toISOString();

  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const timeMs = Math.round(diff[0] * 1000 + diff[1] / 1e6);
    const sizeStr = formatBytes(Number(res.get("content-length") || 0));

    const status = res.statusCode;
    let statusColor = "\x1b[32m"; // Green 2xx
    let statusIcon = "🟢";
    if (status >= 500) {
      statusColor = "\x1b[31m"; // Red 5xx
      statusIcon = "🔴";
    } else if (status >= 400) {
      statusColor = "\x1b[33m"; // Yellow 4xx
      statusIcon = "⚠️ ";
    } else if (status >= 300) {
      statusColor = "\x1b[36m"; // Cyan 3xx
      statusIcon = "🔵";
    }

    const colors = {
      reset: "\x1b[0m",
      gray: "\x1b[90m",
      cyan: "\x1b[36m",
      purple: "\x1b[35m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      boldWhite: "\x1b[1m\x1b[37m",
      GET: "\x1b[32mGET   \x1b[0m",
      POST: "\x1b[33mPOST  \x1b[0m",
      PUT: "\x1b[34mPUT   \x1b[0m",
      PATCH: "\x1b[35mPATCH \x1b[0m",
      DELETE: "\x1b[31mDELETE\x1b[0m",
    };

    const sourceTag =
      source === "DASHBOARD"
        ? `${colors.purple}[DASHBOARD]${colors.reset}`
        : source === "FRONTEND"
          ? `${colors.green}[FRONTEND ]${colors.reset}`
          : `${colors.yellow}[EXTERNAL ]${colors.reset}`;

    const methodStr = colors[req.method] || (req.method + "      ").slice(0, 6);
    const timePadded = `${timeMs}ms`.padStart(6, " ");
    const sizePadded = sizeStr.padStart(8, " ");

    // Keep the line on one row by truncating ultra-long query strings
    let displayUrl = req.originalUrl;
    if (displayUrl.length > 60) {
      displayUrl = displayUrl.slice(0, 57) + "...";
    }

    console.log(
      `${colors.gray}[${now}]${colors.reset} ` +
      `${statusIcon} ${statusColor}${status}${colors.reset} | ` +
      `${sourceTag} | ` +
      `${colors.yellow}${timePadded}${colors.reset} | ` +
      `${colors.cyan}${sizePadded}${colors.reset} | ` +
      `${colors.gray}[IP: ${clientIp}]${colors.reset} | ` +
      `${methodStr} ${colors.boldWhite}${displayUrl}${colors.reset}`
    );

    try {
      broadcastLogToClients({
        timestamp: isoTimestamp,
        status,
        source,
        duration: timeMs,
        responseTime: timeMs,
        size: sizeStr,
        ip: clientIp,
        method: req.method,
        url: req.originalUrl,
        path: req.originalUrl,
      });
    } catch {
      // log streaming must never break a request
    }
  });

  next();
};
