import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { decryptText } from "../utils/crypto.util.js";
import { env } from "../config/env.js";

/**
 * Resolves active SMTP configuration from database (StoreSettingsModel) or environment variables (.env).
 * Gives precedence to DB settings if host & user are provided (or isEnabled is true), falling back to env.
 */
export async function getSmtpConfig() {
  let dbSmtp = {};
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
      dbSmtp = doc?.smtp || {};
    } catch (err) {
      console.warn("[SMTP Config] Failed to fetch StoreSettings from DB, using env fallback:", err.message);
    }
  }

  const useDb = Boolean(dbSmtp.isEnabled && dbSmtp.host && dbSmtp.user);

  const host = (useDb ? dbSmtp.host : env.SMTP_HOST || "smtp.hostinger.com").trim();
  const port = Number(useDb ? dbSmtp.port : env.SMTP_PORT || 465);
  const user = (useDb ? dbSmtp.user : env.SMTP_USER || "").trim();
  const rawPassword = useDb ? decryptText(dbSmtp.password || "") : env.SMTP_PASSWORD || "";
  const password = String(rawPassword).trim();
  
  // Secure option: Port 465 is always SSL/TLS (secure: true). Port 587 uses STARTTLS (secure: false).
  let secure;
  if (useDb && dbSmtp.secure !== undefined) {
    secure = Boolean(dbSmtp.secure);
  } else if (port === 465) {
    secure = true;
  } else if (port === 587) {
    secure = false;
  } else {
    secure = String(env.SMTP_ENCRYPTION || "").toLowerCase() === "ssl";
  }

  const fromName = (useDb && dbSmtp.senderName ? dbSmtp.senderName : env.SMTP_FROM_NAME || "Decantre BD").trim();
  const fromEmail = (useDb && dbSmtp.senderEmail ? dbSmtp.senderEmail : env.SMTP_FROM || user || "").trim();

  const isConfigured = Boolean(host && user && password && password !== "none");

  return {
    host,
    port,
    secure,
    user,
    password,
    fromName,
    fromEmail,
    fromAddress: { name: fromName, address: fromEmail },
    isConfigured,
    source: useDb ? "database" : "env",
  };
}

/**
 * Creates and returns a Nodemailer transport instance with current active SMTP settings.
 */
export async function getSmtpTransport() {
  const config = await getSmtpConfig();

  const isLocalhost = config.host === "127.0.0.1" || config.host === "localhost";
  const hasAuth = !isLocalhost && config.user && config.password;

  const transportConfig = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };

  if (hasAuth) {
    transportConfig.auth = {
      user: config.user,
      pass: config.password,
    };
  }

  const transport = nodemailer.createTransport(transportConfig);

  return {
    transport,
    config,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    fromAddress: config.fromAddress,
    isConfigured: config.isConfigured,
  };
}
