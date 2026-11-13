import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { LogModel } from "../models/log.model.js";
import { getSmtpConfig } from "../services/smtpConfig.service.js";
import { appendEmailToInbox } from "../services/imapSync.service.js";
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
 * A finished `make deploy`: a dashboard notification (bell, live) and a deploy report placed in the
 * Webmail INBOX (IMAP append, since the store mailbox never mails itself over SMTP). Never throws.
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
    const smtp = await getSmtpConfig();
    const mailbox = smtp.fromEmail || smtp.user || `no-reply@${config.domain || "surokkha.store"}`;
    const rows = [
      ["Status", ok ? "Completed" : "Failed"],
      ["Version", `v${version}`],
      ["Commit", commit || "—"],
      ["Branch", branch || "—"],
      ["Server", host || "—"],
      ["When", formatWhen(new Date(at))],
    ];
    const raw = await new MailComposer({
      from: { name: `${brand} Deploy`, address: mailbox },
      to: mailbox,
      subject: `${ok ? "🚀" : "❌"} ${brand} deployed v${version}${ok ? "" : " (FAILED)"}`,
      html: buildEmailHtml({ ok, brand, rows }),
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      headers: { "X-Surokkha-System": `deploy ${target}` },
      date: new Date(at),
    })
      .compile()
      .build();
    const placed = await appendEmailToInbox(raw);
    if (!placed) logger.warn("[DeployNotification] Deploy report not placed in the Webmail inbox (IMAP off or failed)");
  } catch (err) {
    logger.warn({ err: err.message }, "[DeployNotification] Deploy report email failed");
  }
};
