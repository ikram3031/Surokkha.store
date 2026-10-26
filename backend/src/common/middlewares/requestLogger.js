import { env } from "../config/env.js";
import { getClientIp } from "../utils/clientIp.js";
import { RequestLogModel } from "../models/requestLog.model.js";

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

// Which frontend a request came from (SHOP, STORE, OFFER, DASH), by Origin/Referer; falls back to the handling backend
const FALLBACK_BY_LAYER = { storefront: "SHOP", storeweb: "STORE", dashboard: "DASH" };
const getFrontendLabel = (req, layer) => {
  const from = String(req.headers["origin"] || req.headers["referer"] || "").toLowerCase();
  if (from.includes("offer.")) return "OFFER";
  if (from.includes("admin.") || from.includes("dashboard")) return "DASH";
  if (from.includes("surokkha.shop")) return "SHOP";
  if (from.includes("surokkha.store")) return "STORE";
  return FALLBACK_BY_LAYER[layer] || String(layer).toUpperCase();
};

// Logs every API request to the console and stores it for the live System Logs stream.
// layer: which backend process handled it ("storefront" | "storeweb" | "dashboard"); stored as the frontend label
export const createRequestLogger = (layer, config = {}) => (req, res, next) => {
  // Ignore the log endpoints themselves to prevent feedback loops
  if (req.originalUrl && req.originalUrl.startsWith("/api/v1/developer/logs")) {
    return next();
  }

  const startTime = process.hrtime();

  const clientIp = getClientIp(req);

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

    // Fire-and-forget: log storage must never slow down or break a request
    RequestLogModel.create({
      layer: getFrontendLabel(req, layer),
      timestamp: isoTimestamp,
      status,
      source,
      duration: timeMs,
      responseTime: timeMs,
      size: sizeStr,
      ip: clientIp,
      userAgent: (req.headers["user-agent"] || "").slice(0, 200),
      method: req.method,
      url: req.originalUrl,
      path: req.originalUrl,
    }).catch(() => {});
  });

  next();
};
