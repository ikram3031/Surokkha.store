import nodemailer from "nodemailer";
import { buildOtpEmailHtml } from "../templates/otpEmailTemplate.js";
import { env } from "../config/env.js";
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

  const isForgotPassword = type === "forgot-password";
  const subject = isForgotPassword
    ? "Your Decantre Password Reset Code"
    : "Your OTP verification code";
  const text = isForgotPassword
    ? `Hello ${name || "there"},\n\nUse this OTP to reset your Decantre password: ${otp}\nThis code will expire in 3 minutes.\n\nIf you did not request this, please ignore this email.`
    : `Hello ${name || "there"},\n\nYour OTP verification code is ${otp}.\nThis code will expire in 3 minutes.\n\nThank you.`;

  const html = buildOtpEmailHtml({ name, otp, type });
  const fromName = smtpConfig.fromName || env.SMTP_FROM_NAME || "Decantre BD";
  const fromEmail = smtpConfig.fromEmail || smtpConfig.user;
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
    defaultTransport = null;
    return {
      delivered: false,
      reason: error.message || "OTP email delivery failed",
    };
  }
};
