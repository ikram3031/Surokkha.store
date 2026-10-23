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

const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Tells the admin inbox that a dashboard user forgot their password; never throws
export const sendForgotPasswordAlertEmail = async ({ toEmail, user, ip, log = console }) => {
  try {
    if (!toEmail) return { delivered: false, reason: "No admin email address" };
    const { transport, config: smtpConfig } = await getSmtpTransport();
    if (!smtpConfig.isConfigured || !transport) {
      return { delivered: false, reason: "SMTP credentials are not configured" };
    }
    const brandName = smtpConfig.fromName || config.brandName || "Surokkha";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || `no-reply@${config.domain}`;
    const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    const lines = [
      ["Name", user.name || "-"],
      ["Email", user.email],
      ["Role", user.role || "-"],
      ["Requested at", `${when} (Bangladesh time)`],
      ["IP", ip || "-"],
    ];
    await transport.sendMail({
      from: `"${brandName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: user.email,
      subject: `${brandName} Dashboard: ${user.name || user.email} forgot their password`,
      text: `${user.name || user.email} forgot their ${brandName} dashboard password and asked for a reset.\n\n${lines
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")}\n\nReset it from Dashboard > System Users, then share the new password with them.`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
<p><strong>${escapeHtml(user.name || user.email)}</strong> forgot their ${escapeHtml(brandName)} dashboard password and asked for a reset.</p>
<table cellpadding="6" style="border-collapse:collapse">${lines
        .map(([k, v]) => `<tr><td style="color:#666">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`)
        .join("")}</table>
<p>Reset it from <strong>Dashboard &gt; System Users</strong>, then share the new password with them.</p></div>`,
    });
    return { delivered: true };
  } catch (error) {
    log.warn?.({ error, toEmail }, "Forgot password alert email delivery failed");
    return { delivered: false, reason: error.message };
  }
};
