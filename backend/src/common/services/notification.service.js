import { LogModel } from "../models/log.model.js";
import { getOwnerEmails } from "../utils/notificationRecipients.js";
import { getSmtpTransport, getWebmailAddress, copyToWebmailInbox } from "./smtpConfig.service.js";
import { broadcastLiveNotification } from "../websocket.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

// Single place for system notifications: dashboard bell + SMTP email + Webmail inbox copy.
// SMTP/IMAP settings always come from the database (Settings), never from .env.

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const formatWhen = (date, timeZone = "Asia/Dhaka") =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);

// Standard "status card" email body: coloured heading, label/value rows, optional error box
export const buildNotificationHtml = ({ heading, subheading = "", rows = [], accent = "#059669", errorMessage = "" }) => {
  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  const errorBlock = errorMessage
    ? `<p style="margin:16px 0 0;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#991b1b;font-size:13px">${escapeHtml(errorMessage)}</p>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <div style="border:1px solid #e5e7eb;border-top-width:4px;border-top-color:${accent};border-radius:8px;padding:20px">
    <h2 style="margin:0 0 4px;color:${accent};font-size:20px">${escapeHtml(heading)}</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">${escapeHtml(subheading)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${tableRows}</table>
    ${errorBlock}
  </div>
</div>`;
};

export const rowsToText = (rows = [], errorMessage = "") =>
  rows.map(([k, v]) => `${k}: ${v}`).join("\n") + (errorMessage ? `\nError: ${errorMessage}` : "");

// Writes a dashboard (bell) notification and pushes it live. Never throws.
export const recordNotification = async ({ type, typeDid, description, createdBy = "system", updatedBy }) => {
  try {
    const log = await LogModel.create({
      type,
      typeDid,
      description,
      readStatus: false,
      active: true,
      createdBy,
      updatedBy: updatedBy || createdBy,
    });
    broadcastLiveNotification(log).catch((err) => logger.warn({ err: err.message }, "[Notification] Live broadcast failed"));
    return log;
  } catch (err) {
    logger.warn({ err: err.message }, "[Notification] Could not write the dashboard notification");
    return null;
  }
};

/**
 * Sends one system email through the DB-configured SMTP and/or places it in the Webmail inbox. Never throws.
 * to: array/string (SMTP recipients). inboxTo: address shown on the inbox copy (defaults to `to` or the webmail address).
 * Returns { sent, copied }.
 */
export const sendSystemMail = async ({ to = [], subject, html, text, replyTo, fromName, headers, inbox = true, smtpFallbackToWebmail = false }) => {
  const result = { sent: false, copied: false };
  try {
    const [{ transport, config: smtp }, webmailAddress] = await Promise.all([getSmtpTransport(), getWebmailAddress()]);
    const brand = smtp.fromName || config.brandName || "Surokkha";
    const fromEmail = smtp.fromEmail || smtp.user || webmailAddress || `no-reply@${config.domain || "surokkha.store"}`;
    const from = { name: fromName || brand, address: fromEmail };
    const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
    const mail = { from, subject, html, text, ...(replyTo ? { replyTo } : {}), ...(headers ? { headers } : {}) };

    if (inbox) {
      result.copied = await copyToWebmailInbox({
        ...mail,
        to: recipients.length ? recipients.join(", ") : webmailAddress || fromEmail,
      });
    }

    const smtpTargets = recipients.length ? recipients : smtpFallbackToWebmail && !result.copied && webmailAddress ? [webmailAddress] : [];
    if (smtpTargets.length && smtp.isConfigured && transport) {
      try {
        await transport.sendMail({ ...mail, to: smtpTargets });
        result.sent = true;
      } catch (smtpErr) {
        logger.warn({ err: smtpErr.message, subject }, "[Notification] SMTP email failed");
      }
    } else if (smtpTargets.length && !smtp.isConfigured) {
      logger.warn({ subject }, "[Notification] SMTP is not configured; email skipped");
    }
  } catch (err) {
    logger.warn({ err: err.message, subject }, "[Notification] System email failed");
  }
  return result;
};

/**
 * Bell notification + email to every active Owner + Webmail inbox copy. Never throws.
 * log: { type, typeDid, description, createdBy }   mail: { subject, html, text, fromName }
 */
export const notifyOwners = async ({ log, mail }) => {
  if (log) await recordNotification(log);
  if (!mail) return;
  let owners = [];
  try {
    owners = await getOwnerEmails();
  } catch (err) {
    logger.warn({ err: err.message }, "[Notification] Could not load Owner emails");
  }
  await sendSystemMail({ ...mail, to: owners });
};
