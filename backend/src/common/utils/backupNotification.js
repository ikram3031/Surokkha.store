import { notifyOwners, buildNotificationHtml, rowsToText, formatWhen } from "../services/notification.service.js";
import { config } from "../config/index.js";

const TRIGGER_LABELS = {
  SCHEDULER_CRON: "Daily schedule",
  SCHEDULER_CATCH_UP: "Catch-up run (server was down at the scheduled time)",
  MANUAL_TRIGGER: "Started manually",
};

/**
 * Tells the team a backup run has finished: dashboard bell, email to Owners, Webmail inbox copy.
 * Never throws, so a notification problem can't make a good backup look failed.
 * result: { ok, triggeredBy, bucket, database, uploads, pruned, error }
 */
export const notifyBackupResult = async (result) => {
  const { ok, triggeredBy = "SCHEDULER_CRON", bucket = "", database = "", uploads = "", pruned = 0, error = "" } = result;
  const brand = config.brandName || "Surokkha";
  const triggerLabel = TRIGGER_LABELS[triggeredBy] || triggeredBy;

  const rows = [
    ["Status", ok ? "Completed successfully" : "Failed"],
    ["When", formatWhen(new Date())],
    ["Started by", triggerLabel],
  ];
  if (ok) {
    rows.push(["Database", database], ["Uploads", uploads], ["Bucket", bucket]);
    if (pruned) rows.push(["Old backups removed", String(pruned)]);
  }
  const errorMessage = ok ? "" : error;

  await notifyOwners({
    log: {
      type: "backup",
      typeDid: "115",
      description: ok
        ? `Backup completed: database ${database}, uploads ${uploads}${pruned ? `, ${pruned} old backup(s) removed` : ""}. Bucket '${bucket}'.`
        : `Backup FAILED (${triggerLabel}): ${error}`,
      createdBy: triggeredBy,
    },
    mail: {
      subject: ok ? `✅ ${brand}: Backup completed` : `❌ ${brand}: Backup FAILED`,
      html: buildNotificationHtml({
        heading: ok ? "Backup completed" : "Backup failed",
        subheading: `${brand} · Cloudflare R2 backup`,
        rows,
        accent: ok ? "#059669" : "#dc2626",
        errorMessage,
      }),
      text: rowsToText(rows, errorMessage),
    },
  });
};
