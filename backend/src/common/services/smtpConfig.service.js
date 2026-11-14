import crypto from "crypto";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { decryptText } from "../utils/crypto.util.js";
import { env } from "../config/env.js";
import { resolveSite } from "../templates/surokkhaBrand.js";

// Store (surokkha.store) SMTP lives in its own settings document; the shop uses "default"
export const STORE_SMTP_KEY = "store-smtp";
const SITE_SMTP_KEYS = { store: STORE_SMTP_KEY };

// Site an order's emails belong to: its saved site, then (for older orders) the number prefix and domain
export const siteOfOrder = (order) =>
  order?.siteKey === "store" ? "store" : resolveSite({ orderId: order?.orderNumber, clientDomain: order?.clientDomain }).key;

// A site's own SMTP, only when it is switched on and complete; otherwise the caller falls back to the shop's
const readSiteSmtp = async (site) => {
  const key = SITE_SMTP_KEYS[site];
  if (!key || mongoose.connection.readyState !== 1) return null;
  try {
    const doc = await StoreSettingsModel.findOne({ key }).lean();
    const smtp = doc?.smtp || {};
    return smtp.isEnabled && smtp.host && smtp.user && smtp.password ? smtp : null;
  } catch (err) {
    console.warn(`[SMTP Config] Failed to fetch ${key} settings, using shop SMTP:`, err.message);
    return null;
  }
};

// Resolves active SMTP configuration from database with environment fallback; a site with its own SMTP uses that
export const getSmtpConfig = async (site) => {
  const siteSmtp = await readSiteSmtp(site);
  let dbSmtp = siteSmtp || {};
  if (!siteSmtp && mongoose.connection.readyState === 1) {
    try {
      const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
      dbSmtp = doc?.smtp || {};
    } catch (err) {
      console.warn("[SMTP Config] Failed to fetch StoreSettings from DB, using env fallback:", err.message);
    }
  }

  const hasDbCredentials = Boolean(dbSmtp.host && dbSmtp.user && dbSmtp.password);
  const useDb = Boolean(dbSmtp.isEnabled && hasDbCredentials);

  const host = (useDb ? dbSmtp.host : (env.SMTP_HOST || dbSmtp.host || "smtp.hostinger.com")).trim();
  const port = Number(useDb ? dbSmtp.port : (env.SMTP_PORT || dbSmtp.port || 465));
  const user = (useDb ? dbSmtp.user : (env.SMTP_USER || dbSmtp.user || "")).trim();
  const rawPassword = useDb
    ? decryptText(dbSmtp.password || "")
    : (env.SMTP_PASSWORD || decryptText(dbSmtp.password || "") || "");
  const password = String(rawPassword).trim();
  
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

  const defaultBrand = "Surokkha";
  const defaultDomain = "surokkha.store";
  const fromName = (useDb && dbSmtp.senderName ? dbSmtp.senderName : env.SMTP_FROM_NAME || defaultBrand).trim();
  const fromEmail = (useDb && dbSmtp.senderEmail ? dbSmtp.senderEmail : env.SMTP_FROM || user || `support@${defaultDomain}`).trim();

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
    source: siteSmtp ? SITE_SMTP_KEYS[site] : useDb ? "database" : (hasDbCredentials ? "database-fallback" : "env"),
  };
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

const parseAddressList = (field) =>
  toList(field)
    .map((entry) => {
      if (typeof entry === "object" && entry) {
        return { name: String(entry.name || ""), address: String(entry.address || "").toLowerCase().trim() };
      }
      const str = String(entry || "").trim();
      const match = str.match(/^(.*?)\s*<([^>]+)>$/);
      if (match) {
        return { name: match[1].replace(/^["']|["']$/g, "").trim(), address: match[2].toLowerCase().trim() };
      }
      return { name: "", address: str.toLowerCase().trim() };
    })
    .filter((item) => item.address);

/**
 * Mailbox copy: every email the store or shop sends is also recorded in Webmail's Sent folder
 * (and appended to IMAP Sent when IMAP is enabled), so orders and notifications show up in Webmail.
 * It is never re-sent over SMTP, so nothing bounces or loops.
 * Emails with one-time codes or sign-in links pass { mailboxCopy: false } and are never copied.
 */
const shopCopyEnabled = async () => {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).select("imap.isEnabled imap.copySentMail").lean();
    return Boolean(doc?.imap?.isEnabled) && doc?.imap?.copySentMail !== false;
  } catch {
    return false;
  }
};

const saveWebmailSentCopy = async (options, targetMailbox, fallbackFromEmail) => {
  if (mongoose.connection.readyState !== 1) return;
  const { EmailMessageModel } = await import("../models/emailMessage.model.js");
  const { mailboxFilter } = await import("./imapSync.service.js");
  const fromList = parseAddressList(options.from || fallbackFromEmail);
  const from = fromList[0] || { name: "", address: addressOf(fallbackFromEmail) || "no-reply@surokkha.store" };
  const bodyHtml = options.html || (options.text ? `<pre>${options.text}</pre>` : "");
  const bodyText = options.text || String(options.html || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  const snippet = bodyText.slice(0, 160);
  const messageId = options.messageId;

  await EmailMessageModel.findOneAndUpdate(
    { ...mailboxFilter(targetMailbox), messageId },
    {
      $setOnInsert: {
        mailbox: targetMailbox,
        messageId,
        folder: "Sent",
        from,
        to: parseAddressList(options.to),
        cc: parseAddressList(options.cc),
        bcc: parseAddressList(options.bcc),
        replyTo: parseAddressList(options.replyTo),
        subject: options.subject || "(No Subject)",
        snippet,
        bodyHtml,
        bodyText,
        date: new Date(),
        isRead: true,
        inReplyTo: options.inReplyTo || null,
        references: Array.isArray(options.references) ? options.references : options.references ? [options.references] : [],
        threadId: options.inReplyTo || messageId,
        active: true,
      },
    },
    { upsert: true }
  );
};

const copyToMailbox = async (options, site, fallbackFromEmail) => {
  // Loaded here because imapSync itself imports this module
  const { appendEmailToSentFolder, isStoreMailboxConfigured } = await import("./imapSync.service.js");
  const storeConfigured = await isStoreMailboxConfigured();
  const shopImapOn = await shopCopyEnabled();

  const targets = new Set();
  // Always mirror into the Store Webmail when it is configured, so orders & notifications from any site appear there
  if (storeConfigured) targets.add("store");
  if (site !== "store" && (shopImapOn || !storeConfigured)) targets.add("shop");

  if (targets.size === 0) return;

  for (const targetMailbox of targets) {
    await saveWebmailSentCopy(options, targetMailbox, fallbackFromEmail).catch((err) =>
      console.warn(`[Webmail Copy] Failed saving Sent copy for ${targetMailbox}:`, err.message)
    );
  }

  const raw = await new MailComposer(options).compile().build();
  if (storeConfigured) {
    await appendEmailToSentFolder(raw, "store").catch((err) =>
      console.warn("[SMTP] Store IMAP Sent append failed:", err.message)
    );
  }
  if (targets.has("shop") && shopImapOn) {
    await appendEmailToSentFolder(raw, "shop").catch((err) =>
      console.warn("[SMTP] Shop IMAP Sent append failed:", err.message)
    );
  }
};

const domainOf = (address) => addressOf(address).split("@")[1] || "surokkha.store";

const withMailboxCopy = (transport, fromEmail, site) => {
  const send = transport.sendMail.bind(transport);
  transport.sendMail = async (options = {}, callback) => {
    // Same Message-ID on the sent mail and its copy, so the Sent folder sync doesn't list it twice
    const message = { ...options, messageId: options.messageId || `<${crypto.randomUUID()}@${domainOf(options.from || fromEmail)}>` };
    try {
      const info = await send(message);
      if (!info?.skipped) {
        copyToMailbox(message, site, fromEmail).catch((err) => console.warn("[SMTP] Mailbox copy failed:", err.message));
      }
      if (callback) return callback(null, info);
      return info;
    } catch (err) {
      if (callback) return callback(err);
      throw err;
    }
  };
  return transport;
};

// Creates and returns a Nodemailer transport instance with current active SMTP settings for a site ("shop" by default)
export const getSmtpTransport = async (site, { mailboxCopy = true } = {}) => {
  const config = await getSmtpConfig(site);

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

  const guarded = guardSelfSend(nodemailer.createTransport(transportConfig), [config.user, config.fromEmail]);
  const transport = mailboxCopy ? withMailboxCopy(guarded, config.fromEmail, site) : guarded;

  return {
    transport,
    config,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    fromAddress: config.fromAddress,
    isConfigured: config.isConfigured,
  };
};
