import nodemailer from "nodemailer";
import { buildOtpEmailHtml } from "../templates/otpEmailTemplate.js";
import { env } from "../config/env.js";

let defaultTransport;

// Dynamically retrieve or initialize SMTP transport
const getTransport = () => {
  if (!defaultTransport) {
    const isSecure =
      Number(env.SMTP_PORT) === 465 ||
      String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

    defaultTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: isSecure,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return defaultTransport;
};

// Sends OTP verification or password reset email
export const sendOtpEmail = async ({
  toEmail,
  otp,
  name,
  type = "registration",
  transport,
  log = console,
}) => {
  const activeTransport = transport || getTransport();

  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
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
  const fromName = env.SMTP_FROM_NAME || "Decantre BD";
  const fromEmail = env.SMTP_FROM || env.SMTP_USER;
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
