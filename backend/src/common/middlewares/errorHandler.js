import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  const clientIp =
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "Unknown IP";
  const now = new Date().toLocaleTimeString("en-US", { hour12: false });

  const redBg = "\x1b[41m\x1b[37m\x1b[1m";
  const reset = "\x1b[0m";
  const redText = "\x1b[31m";
  const gray = "\x1b[90m";

  console.error(
    `\n${redBg} 💥 ERROR DETECTED ${reset} ` +
    `${gray}[${now}]${reset} ` +
    `[IP: ${clientIp}] ${req.method} ${req.originalUrl}\n` +
    `${redText}➡️ Message: ${err.message}${reset}`
  );
  if (err.stack) {
    console.error(`${gray}${err.stack}${reset}\n`);
  }

  let status = err.status ?? err.statusCode;
  let message = err.message ?? "Internal Server Error";

  if (err.name === "MulterError") {
    status = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the allowable limit (max 10MB)";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected form field '${err.field}'. Expected field name is 'image'.`;
    }
  }

  status = status ?? 500;

  res.status(status).json({
    status: "error",
    message,
  });
};

