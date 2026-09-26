import crypto from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// Validates X-Tenant-DID and HMAC SHA-256 X-Signature headers for Node Agent telemetry webhooks
export const verifyTelemetryAuth = (req, res, next) => {
  const tenantDid = req.headers["x-tenant-did"];
  const signature = req.headers["x-signature"];

  if (!tenantDid || !signature) {
    logger.warn({ ip: req.ip, tenantDid }, "Telemetry webhook rejected: missing DID or Signature headers");
    return res.status(401).json({ status: "error", message: "Missing X-Tenant-DID or X-Signature header" });
  }

  const secret = env.AGENT_SECRET_KEY || env.ACCESS_TOKEN_SECRET;
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const isTimingSafeMatch =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expectedSignature, "utf8"));

  if (!isTimingSafeMatch) {
    logger.warn({ ip: req.ip, tenantDid }, "Telemetry webhook rejected: invalid HMAC signature");
    return res.status(401).json({ status: "error", message: "Invalid HMAC signature" });
  }

  req.tenantDid = tenantDid;
  next();
};
