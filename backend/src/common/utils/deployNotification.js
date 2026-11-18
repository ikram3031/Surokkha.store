import { LogModel } from "../models/log.model.js";
import { getOwnerEmails } from "./notificationRecipients.js";
import { getSmtpTransport, getWebmailAddress, copyToWebmailInbox } from "../services/smtpConfig.service.js";
import { broadcastLiveNotification } from "../websocket.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const formatWhen = (date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(date);

const buildEmailHtml = ({ ok, brand, rows }) => {
  const accent = ok ? "#059669" : "#dc2626";
  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#111827;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px">
  <div style="border:1px solid #e5e7eb;border-top-width:4px;border-top-color:${accent};border-radius:8px;padding:20px">
    <h2 style="margin:0 0 4px;color:${accent};font-size:20px">${ok ? "Deploy completed" : "Deploy failed"}</h2>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px">${escapeHtml(brand)} · make deploy</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">${tableRows}</table>
  </div>
</div>`;
};

/**
 * A finished `make deploy`: a dashboard notification (bell, live), an email to all active Owners,
 * and a deploy report placed in the Webmail INBOX. Never throws.
 * entry: { target, version, commit, branch, host, at, status }
 */
export const notifyDeploy = async ({ target, version, commit = "", branch = "", host = "", at = new Date(), status = "SUCCESS" }) => {
  const ok = String(status).toUpperCase() !== "FAILED";
  const brand = config.brandName || "Surokkha";

  try {
    const log = await LogModel.create({
      type: "deploy",
      typeDid: "117",
      description: `${ok ? "Deployed" : "Deploy FAILED"} ${brand} v${version}${commit ? `: ${commit.slice(0, 80)}` : ""}`,
      readStatus: false,
      active: true,
      createdBy: "make-deploy",
    });
    broadcastLiveNotification(log).catch((err) => logger.warn({ err: err.message }, "[DeployNotification] Live notification failed"));
  } catch (err) {
    logger.warn({ err: err.message }, "[DeployNotification] Could not write the dashboard notification");
  }

  try {
    const [{ transport, config: smtp }, ownerEmails, webmailAddress] = await Promise.all([
      getSmtpTransport(),
      getOwnerEmails().catch((err) => {
        logger.warn({ err: err.message }, "[DeployNotification] Could not load Owner emails");
        return [];
      }),
      getWebmailAddress(),
    ]);

    const fromEmail = smtp.fromEmail || smtp.user || webmailAddress || `no-reply@${config.domain || "surokkha.store"}`;
    const fromAddress = { name: `${brand} Deploy`, address: fromEmail };
    const rows = [
      ["Status", ok ? "Completed" : "Failed"],
      ["Version", `v${version}`],
      ["Commit", commit || "—"],
      ["Branch", branch || "—"],
      ["Server", host || "—"],
      ["When", formatWhen(new Date(at))],
    ];
    const subject = `${ok ? "🚀" : "❌"} ${brand} deployed v${version}${ok ? "" : " (FAILED)"}`;
    const html = buildEmailHtml({ ok, brand, rows });
    const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

    if (smtp.isConfigured && transport && ownerEmails.length > 0) {
      try {
        await transport.sendMail({
          from: fromAddress,
          to: ownerEmails,
          subject,
          html,
          text,
          headers: { "X-Surokkha-System": `deploy ${target}` },
        });
        logger.info({ recipients: ownerEmails.length }, "[DeployNotification] Deploy email sent to Owners");
      } catch (smtpErr) {
        logger.warn({ err: smtpErr.message }, "[DeployNotification] Deploy SMTP email failed");
      }
    }

    const placed = await copyToWebmailInbox({
      from: fromAddress,
      to: ownerEmails.length ? ownerEmails.join(", ") : webmailAddress || fromEmail,
      subject,
      html,
      text,
    });
    if (!placed) logger.warn("[DeployNotification] Deploy report not placed in the Webmail inbox (IMAP off or failed)");
  } catch (err) {
    logger.warn({ err: err.message }, "[DeployNotification] Deploy report email failed");
  }
};
