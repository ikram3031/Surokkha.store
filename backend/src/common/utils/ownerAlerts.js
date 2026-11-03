import { UserModel } from "../models/user.model.js";
import { env } from "../config/env.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";
import { getSmtpTransport } from "../services/smtpConfig.service.js";
import { getClientIp } from "./clientIp.js";

// Emails every active Owner; failures are logged and never block the request
export const alertOwners = async ({ subject, lines }) => {
  try {
    const owners = await UserModel.find({ role: "Owner", isActive: true }).select("email").lean();
    if (owners.length === 0) return;

    const { transport, config: smtpConfig } = await getSmtpTransport();
    if (!smtpConfig.isConfigured || !transport) return;

    const brandName = smtpConfig.fromName || config?.brandName || env.SMTP_FROM_NAME || "Store";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user;
    await transport.sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: owners.map((owner) => owner.email),
      subject: `[Security] ${subject}`,
      text: lines.join("\n"),
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
