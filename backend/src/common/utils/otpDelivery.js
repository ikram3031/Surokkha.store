import nodemailer from "nodemailer";
import { buildOtpEmailHtml } from "../templates/otpEmailTemplate.js";
import { buildPasswordChangedEmailHtml } from "../templates/passwordChangedEmailTemplate.js";
import { env } from "../config/env.js";
import { config } from "../config/index.js";
import { getSmtpTransport } from "../services/smtpConfig.service.js";

// Sends OTP verification or password reset email
export const sendOtpEmail = async ({
  toEmail,
  otp,
  name,
  type = "registration",
  transport,
  log = console,
}) => {
  const smtpResult = await getSmtpTransport();
  const activeTransport = transport || smtpResult.transport;
  const smtpConfig = smtpResult.config;

  if (!smtpConfig.isConfigured) {
    return {
      delivered: false,
      reason: "SMTP credentials are not configured",
    };
  }

  const brandName = smtpConfig.fromName || config.brandName || "Surokkha";
  const isForgotPassword = type === "forgot-password";
  const subject = isForgotPassword
    ? `Your ${brandName} Password Reset Code`
    : `Your ${brandName} OTP verification code`;
  const text = isForgotPassword
    ? `Hello ${name || "there"},\n\nUse this OTP to reset your ${brandName} password: ${otp}\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`
    : `Hello ${name || "there"},\n\nYour OTP verification code is ${otp}.\nThis code will expire in 10 minutes.\n\nThank you for choosing ${brandName}.`;

  const logoUrl = config.logoUrl || "https://admin.surokkha.store/surokkha_logo.png";
  const html = buildOtpEmailHtml({ name, otp, type, logoUrl });
  const fromName = brandName;
  const fromEmail = smtpConfig.fromEmail || smtpConfig.user || `no-reply@${config.domain || 'surokkha.store'}`;
  const fromAddress = `"${fromName}" <${fromEmail}>`;

  try {
    await activeTransport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html,
    });

    return { delivered: true };
  } catch (error) {
    log.warn?.({ error, toEmail }, "OTP email delivery failed");
    return {
      delivered: false,
      reason: error.message || "OTP email delivery failed",
    };
  }
};

// Sends the "your password was changed" confirmation; never throws, so a failed email can't undo a reset
export const sendPasswordChangedEmail = async ({ toEmail, name, byAdmin = false, log = console }) => {
  try {
    if (!toEmail) return { delivered: false, reason: "No email address" };
    const { transport, config: smtpConfig } = await getSmtpTransport();
    if (!smtpConfig.isConfigured || !transport) {
      return { delivered: false, reason: "SMTP credentials are not configured" };
    }
    const brandName = smtpConfig.fromName || config.brandName || "Surokkha";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || `no-reply@${config.domain}`;
    await transport.sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: toEmail,
      subject: `Your ${brandName} password was changed`,
      text: `Hello ${name || "there"},\n\nThe password for your ${brandName} account was ${byAdmin ? "reset by an administrator" : "just reset"}.\nIf you didn't do this, contact us right away.`,
      html: buildPasswordChangedEmailHtml({ name, byAdmin }),
    });
    return { delivered: true };
  } catch (error) {
    log.warn?.({ error, toEmail }, "Password changed email delivery failed");
    return { delivered: false, reason: error.message };
  }
};
