import { config } from "../config/index.js";
import { logger } from "../config/logger.js";
import { getOwnerEmails } from "./notificationRecipients.js";
import { getSmtpTransport, getWebmailAddress, copyToWebmailInbox } from "../services/smtpConfig.service.js";
import { getClientIp } from "./clientIp.js";

// Emails every active Owner (ignoring toggle list) and places a copy in Webmail Inbox; never blocks requests
export const alertOwners = async ({ subject, lines }) => {
  try {
    const [ownerEmails, { transport, config: smtpConfig }, webmailAddress] = await Promise.all([
      getOwnerEmails(),
      getSmtpTransport(),
      getWebmailAddress(),
    ]);

    const brandName = smtpConfig.fromName || config?.brandName || "Surokkha";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || webmailAddress || `no-reply@${config?.domain || "surokkha.store"}`;
    const fromAddress = `"${brandName}" <${fromEmail}>`;
    const fullSubject = `[Security] ${subject}`;
    const text = lines.join("\n");

    if (ownerEmails.length > 0 && smtpConfig.isConfigured && transport) {
      try {
        await transport.sendMail({
          from: fromAddress,
          to: ownerEmails,
          subject: fullSubject,
          text,
        });
      } catch (smtpErr) {
        logger.warn({ error: smtpErr.message, subject }, "Owner security alert SMTP delivery failed");
      }
    }

    await copyToWebmailInbox({
      from: fromAddress,
      to: ownerEmails.length > 0 ? ownerEmails.join(", ") : webmailAddress || fromEmail,
      subject: fullSubject,
      text,
    });
  } catch (error) {
    logger.warn({ error: error.message, subject }, "Owner security alert delivery failed");
  }
};

// Alerts Owners after an Admin successfully performs the labelled sensitive action
export const alertOwnersOnAdminAction = (action) => (req, res, next) => {
  if (req.user?.role === "Admin") {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      alertOwners({
        subject: `Admin action: ${action}`,
        lines: [
          `Admin: ${req.user.name} (${req.user.email})`,
          `Action: ${action}`,
          `Request: ${req.method} ${req.originalUrl}`,
          `IP: ${getClientIp(req)}`,
          `Time: ${new Date().toISOString()}`,
        ],
      });
    });
  }
  return next();
};

// Remembers the login IP on the user document and alerts Owners when an Admin signs in from a new one
export const trackAdminLoginIp = (user, req) => {
  const ip = getClientIp(req);
  if (user.role === "Admin" && user.lastLoginIp && user.lastLoginIp !== ip) {
    alertOwners({
      subject: "Admin login from a new IP",
      lines: [
        `Admin: ${user.name} (${user.email})`,
        `New IP: ${ip}`,
        `Previous IP: ${user.lastLoginIp}`,
        `Time: ${new Date().toISOString()}`,
      ],
    });
  }
  user.lastLoginIp = ip;
};
