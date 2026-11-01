import { LogModel } from "../models/log.model.js";
import { getNotificationRecipientEmails } from "./notificationRecipients.js";
import { getSmtpTransport } from "../services/smtpConfig.service.js";
import { broadcastLiveNotification } from "../websocket.js";
import { config } from "../config/index.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const TRIGGER_LABELS = {
  SCHEDULER_CRON: "Daily schedule",
  SCHEDULER_CATCH_UP: "Catch-up run (server was down at the scheduled time)",
  MANUAL_TRIGGER: "Started manually",
};

const formatWhen = (date, timeZone) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: timeZone || "Asia/Dhaka" }).format(date);

// Everyone who should hear about a backup: the alert-recipient list plus the store admin addresses
const resolveRecipients = async () => {
  const set = new Set();
  if (env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_NOTIFY_EMAIL) {
    set.add(String(env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_NOTIFY_EMAIL).toLowerCase().trim());
  }
  if (config.supportEmail) set.add(String(config.supportEmail).toLowerCase().trim());
  try {
    (await getNotificationRecipientEmails()).forEach((email) => set.add(String(email).toLowerCase().trim()));
  } catch (error) {
    logger.warn({ err: error.message }, "[BackupNotification] Could not load alert recipients");
  }
  return [...set].filter(Boolean);
};

const buildEmailHtml = ({ ok, brand, rows, errorMessage }) => {
  const accent = ok ? "#059669" : "#dc2626";
  const heading = ok ? "Backup completed" : "Backup failed";
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
  <div style="border-top:4px solid ${accent};border:1px solid #e5e7eb;border-top-width:4px;border-top-color:${accent};border-radius:8px;padding:20px">
    <h2 style="margin:0 0 4px;color:${accent};font-size:20px">${heading}</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">${escapeHtml(brand)} · Cloudflare R2 backup</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${tableRows}</table>
    ${errorBlock}
  </div>
</div>`;
};

/**
 * Tells the team a backup run has finished: a dashboard notification (bell, live) and an email.
 * Never throws, so a notification problem can't make a good backup look failed.
 * result: { ok, triggeredBy, bucket, database, uploads, pruned, error }
 */
export const notifyBackupResult = async (result) => {
  const { ok, triggeredBy = "SCHEDULER_CRON", bucket = "", database = "", uploads = "", pruned = 0, error = "" } = result;
  const finishedAt = new Date();
  const triggerLabel = TRIGGER_LABELS[triggeredBy] || triggeredBy;

  const description = ok
    ? `Backup completed: database ${database}, uploads ${uploads}${pruned ? `, ${pruned} old backup(s) removed` : ""}. Bucket '${bucket}'.`
    : `Backup FAILED (${triggerLabel}): ${error}`;

  try {
    const log = await LogModel.create({
      type: "backup",
      typeDid: "115",
      description,
      readStatus: false,
      active: true,
      createdBy: triggeredBy,
    });
    broadcastLiveNotification(log).catch((err) => logger.warn({ err: err.message }, "[BackupNotification] Live notification failed"));
  } catch (err) {
    logger.warn({ err: err.message }, "[BackupNotification] Could not write the dashboard notification");
  }

  try {
    const { transport, config: smtp } = await getSmtpTransport();
    if (!smtp.isConfigured) {
      logger.warn("[BackupNotification] SMTP is not configured; backup email skipped");
      return;
    }
    const recipients = await resolveRecipients();
    if (!recipients.length) {
      logger.warn("[BackupNotification] No recipients for the backup email");
      return;
    }

    const brand = smtp.fromName || config.brandName || "Surokkha";
    const fromEmail = smtp.fromEmail || smtp.user || `no-reply@${config.domain || "surokkha.store"}`;
    const rows = [
      ["Status", ok ? "Completed successfully" : "Failed"],
      ["When", formatWhen(finishedAt)],
      ["Started by", triggerLabel],
    ];
    if (ok) {
      rows.push(["Database", database], ["Uploads", uploads], ["Bucket", bucket]);
      if (pruned) rows.push(["Old backups removed", String(pruned)]);
    }

    await transport.sendMail({
      from: { name: brand, address: fromEmail },
      to: recipients,
      subject: ok ? `✅ ${brand}: Backup completed` : `❌ ${brand}: Backup FAILED`,
      html: buildEmailHtml({ ok, brand, rows, errorMessage: ok ? "" : error }),
    });
    logger.info({ recipients: recipients.length }, "[BackupNotification] Backup email sent");
  } catch (err) {
    logger.warn({ err: err.message }, "[BackupNotification] Backup email failed");
  }
};
