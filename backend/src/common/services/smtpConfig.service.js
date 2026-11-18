import mongoose from "mongoose";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { decryptText } from "../utils/crypto.util.js";

// Resolves active SMTP configuration strictly from the database ("default" settings document)
export const getSmtpConfig = async () => {
  let dbSmtp = {};
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
      dbSmtp = doc?.smtp || {};
    } catch (err) {
      console.warn("[SMTP Config] Failed to fetch StoreSettings from DB:", err.message);
    }
  }

  const host = String(dbSmtp.host || "").trim();
  const port = Number(dbSmtp.port || 465);
  const user = String(dbSmtp.user || "").trim();
  const password = String(dbSmtp.password ? decryptText(dbSmtp.password) : "").trim();
  const secure = dbSmtp.secure !== undefined ? Boolean(dbSmtp.secure) : port === 465;

  const fromName = String(dbSmtp.senderName || "Surokkha").trim();
  const fromEmail = String(dbSmtp.senderEmail || user || "").trim();

  const isConfigured = Boolean(dbSmtp.isEnabled && host && user && password && password !== "none");

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
    source: "database",
  };
};

// Returns the configured Webmail IMAP inbox address from the database (or "" if unset)
export const getWebmailAddress = async () => {
  if (mongoose.connection.readyState !== 1) return "";
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).select("imap").lean();
    return String(doc?.imap?.user || "").trim();
  } catch (err) {
    console.warn("[SMTP Config] Failed to fetch Webmail address from DB:", err.message);
    return "";
  }
};

const addressOf = (entry) => {
  const raw = typeof entry === "object" && entry ? entry.address : String(entry || "");
  const match = String(raw).match(/<([^>]+)>/);
  return (match ? match[1] : raw).toLowerCase().trim();
};

const toList = (field) =>
  (Array.isArray(field) ? field : field ? [field] : []).flatMap((entry) =>
    typeof entry === "string" ? entry.split(",").map((part) => part.trim()).filter(Boolean) : [entry]
  );

// Outgoing guard: the mailbox that sends a message is never one of its recipients, so it never mails itself
export const guardSelfSend = (transport, senderAddresses) => {
  const senders = new Set(senderAddresses.map(addressOf).filter(Boolean));
  const send = transport.sendMail.bind(transport);
  transport.sendMail = (options = {}, callback) => {
    const filtered = { ...options };
    for (const field of ["to", "cc", "bcc"]) {
      if (filtered[field]) filtered[field] = toList(filtered[field]).filter((entry) => !senders.has(addressOf(entry)));
    }
    if (![filtered.to, filtered.cc, filtered.bcc].some((list) => list?.length)) {
      const skipped = { skipped: true, accepted: [], rejected: [], reason: "only recipient was the sending mailbox" };
      if (callback) return callback(null, skipped);
      return Promise.resolve(skipped);
    }
    return send(filtered, callback);
  };
  return transport;
};

// Creates and returns a Nodemailer transport instance with the single active SMTP configuration
export const getSmtpTransport = async () => {
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

  const transport = guardSelfSend(nodemailer.createTransport(transportConfig), [config.user, config.fromEmail]);

  return {
    transport,
    config,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    fromAddress: config.fromAddress,
    isConfigured: config.isConfigured,
  };
};

// Copies a system/notification email directly into the Webmail IMAP INBOX (never throws)
export const copyToWebmailInbox = async ({ subject, html, text, from, to, replyTo, headers } = {}) => {
  try {
    if (mongoose.connection.readyState !== 1) return false;
    const doc = await StoreSettingsModel.findOne({ key: "default" }).select("imap").lean();
    const imap = doc?.imap || {};
    const imapHost = String(imap.host || "").trim();
    const imapUser = String(imap.user || "").trim();
    const imapPass = imap.password ? String(decryptText(imap.password)).trim() : "";

    if (!imap.isEnabled || !imapHost || !imapUser || !imapPass) {
      return false;
    }

    const smtp = await getSmtpConfig();
    const hasValidFrom =
      typeof from === "string"
        ? Boolean(from.trim())
        : Boolean(from && typeof from === "object" && String(from.address || "").trim());
    const hasValidTo = Array.isArray(to)
      ? to.length > 0
      : Boolean(typeof to === "string" ? to.trim() : to && typeof to === "object" && String(to.address || "").trim());

    const mailOptions = {
      from: hasValidFrom ? from : smtp.fromEmail ? smtp.fromAddress : imapUser,
      to: hasValidTo ? to : imapUser,
      subject: subject || "(No Subject)",
      headers: { "X-Surokkha-System": "1", ...(headers || {}) },
      date: new Date(),
    };
    if (replyTo) mailOptions.replyTo = replyTo;
    if (html !== undefined) mailOptions.html = html;
    if (text !== undefined) mailOptions.text = text;

    const rawBuffer = await new MailComposer(mailOptions).compile().build();
    const { appendEmailToInbox } = await import("./imapSync.service.js");
    return Boolean(await appendEmailToInbox(rawBuffer));
  } catch (err) {
    console.warn("[Webmail Inbox Copy] Failed to copy message to Webmail inbox:", err.message);
    return false;
  }
};
