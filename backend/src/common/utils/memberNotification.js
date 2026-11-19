import { LogModel, LOG_TYPES, LOG_TYPE_DIDS } from "../models/log.model.js";
import { broadcastLiveNotification } from "../websocket.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";
import { getSmtpTransport, getWebmailAddress, copyToWebmailInbox } from "../services/smtpConfig.service.js";

// Escapes special HTML characters for safe email markup
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Formats timestamp in Asia/Dhaka timezone for notification details
const formatWhen = (date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(date);

// Records a dashboard notification and emails the configured IMAP mailbox on new member registration
export const notifyMemberRegistered = (member) => {
  if (!member?.email) return;

  setImmediate(async () => {
    const name = String(member.name || "").trim() || member.email;
    const email = String(member.email || "").trim().toLowerCase();
    const phone = String(member.phone || "").trim();

    try {
      const log = await LogModel.create({
        type: LOG_TYPES.NEW_MEMBER,
        typeDid: LOG_TYPE_DIDS.newMember,
        description: `New member registered: ${name} (${email})`,
        readStatus: false,
        active: true,
        createdBy: "customer",
        updatedBy: "customer",
      });
      broadcastLiveNotification(log).catch((wsErr) => {
        logger.warn({ err: wsErr?.message }, "[MemberNotification] Live notification broadcast failed");
      });
    } catch (logErr) {
      logger.warn({ err: logErr?.message }, "[MemberNotification] Could not write dashboard notification");
    }

    try {
      const [webmailAddress, { transport, config: smtp }] = await Promise.all([
        getWebmailAddress(),
        getSmtpTransport(),
      ]);
      if (!webmailAddress) {
        logger.warn("[MemberNotification] IMAP email is not configured; member registration email skipped");
        return;
      }

      const brand = smtp.fromName || config.brandName || "Surokkha";
      const fromEmail = smtp.fromEmail || smtp.user || webmailAddress;
      const fromAddress = { name: brand, address: fromEmail };
      const subject = `New Member Registered: ${name} (${email})`;
      const rows = [
        ["Name", name],
        ["Email", email],
        ...(phone ? [["Phone", phone]] : []),
        ["Registered At", formatWhen(new Date())],
      ];
      const text = `A new member has registered on ${brand}.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`;
      const tableRows = rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px">${escapeHtml(label)}</td>` +
            `<td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600">${escapeHtml(value)}</td></tr>`
        )
        .join("");
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
          <div style="background:#059669;color:#fff;padding:14px 20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:16px">New Member Registered — ${escapeHtml(brand)}</h2>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:0;padding:18px 20px;border-radius:0 0 8px 8px">
            <table style="border-collapse:collapse;width:100%">${tableRows}</table>
          </div>
        </div>
      `;

      const copied = await copyToWebmailInbox({
        from: fromAddress,
        to: webmailAddress,
        replyTo: email,
        subject,
        text,
        html,
      });

      if (!copied && smtp.isConfigured && transport) {
        await transport.sendMail({
          from: fromAddress,
          to: webmailAddress,
          replyTo: email,
          subject,
          text,
          html,
        });
      }
    } catch (err) {
      logger.warn({ err: err?.message, email }, "[MemberNotification] Failed to send member registration email");
    }
  });
};
