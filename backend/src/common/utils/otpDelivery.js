import { buildOtpEmailHtml, otpEmailCopy } from "../templates/otpEmailTemplate.js";
import { buildPasswordChangedEmailHtml } from "../templates/passwordChangedEmailTemplate.js";
import { config } from "../config/index.js";
import { getSmtpTransport, getSmtpConfig, getWebmailAddress, copyToWebmailInbox } from "../services/smtpConfig.service.js";

const escapeHtml = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Sends OTP verification or password reset email (never copied to Webmail Inbox)
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

  if (!smtpConfig.isConfigured || !activeTransport) {
    return {
      delivered: false,
      reason: "SMTP credentials are not configured",
    };
  }

  const brandName = smtpConfig.fromName || config.brandName || "Surokkha";
  // Subject and wording follow the OTP purpose (registration, forgot-password, membership)
  const copy = otpEmailCopy(type);
  const subject = copy.subject(brandName);
  const text = `Hello ${name || "there"},

Use this code to ${copy.action}: ${otp}
This code will expire in 10 minutes.

If you did not request this, please ignore this email.`;

  const logoUrl = config.logoUrl || "https://admin.surokkha.store/surokkha_logo.png";
  const html = buildOtpEmailHtml({ name, otp, type, logoUrl });
  const fromName = brandName;
  const fromEmail = smtpConfig.fromEmail || smtpConfig.user || `no-reply@${config.domain || "surokkha.store"}`;
  const fromAddress = `"${fromName}" <${fromEmail}>`;
  const webmailAddress = await getWebmailAddress();

  try {
    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html,
    };
    if (webmailAddress) {
      mailOptions.replyTo = { name: brandName, address: webmailAddress };
    }
    await activeTransport.sendMail(mailOptions);

    return { delivered: true };
  } catch (error) {
    log.warn?.({ error, toEmail }, "OTP email delivery failed");
    return {
      delivered: false,
      reason: error.message || "OTP email delivery failed",
    };
  }
};

// Sends the "your password was changed" confirmation; never throws, so a failed email can't undo a reset.
// When notifyWebmail is true (dashboard users only), also places a short notice in Webmail Inbox.
export const sendPasswordChangedEmail = async ({
  toEmail,
  name,
  byAdmin = false,
  notifyWebmail = false,
  log = console,
}) => {
  try {
    if (!toEmail) return { delivered: false, reason: "No email address" };
    const { transport, config: smtpConfig } = await getSmtpTransport();
    const brandName = smtpConfig.fromName || config.brandName || "Surokkha";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || `no-reply@${config.domain || "surokkha.store"}`;
    const fromAddress = `"${brandName}" <${fromEmail}>`;
    const webmailAddress = await getWebmailAddress();

    let delivered = false;
    let reason;
    if (smtpConfig.isConfigured && transport) {
      const mailOptions = {
        from: fromAddress,
        to: toEmail,
        subject: `Your ${brandName} password was changed`,
        text: `Hello ${name || "there"},\n\nThe password for your ${brandName} account was ${byAdmin ? "reset by an administrator" : "just reset"}.\nIf you didn't do this, contact us right away.`,
        html: buildPasswordChangedEmailHtml({ name, byAdmin }),
      };
      if (webmailAddress) {
        mailOptions.replyTo = { name: brandName, address: webmailAddress };
      }
      await transport.sendMail(mailOptions);
      delivered = true;
    } else {
      reason = "SMTP credentials are not configured";
    }

    if (notifyWebmail) {
      const displayName = name || toEmail;
      const noticeText = `${displayName} (${toEmail})'s password was changed${byAdmin ? " by an admin" : ""}.`;
      await copyToWebmailInbox({
        from: fromAddress,
        to: webmailAddress || toEmail,
        subject: `Password Changed: ${displayName}`,
        text: noticeText,
        html: `<p>${escapeHtml(noticeText)}</p>`,
      });
    }

    return delivered ? { delivered: true } : { delivered: false, reason };
  } catch (error) {
    log.warn?.({ error, toEmail }, "Password changed email delivery failed");
    return { delivered: false, reason: error.message };
  }
};

// Places a forgot-password alert ONLY into the Webmail Inbox; never throws
export const sendForgotPasswordAlertEmail = async ({ user, ip, log = console }) => {
  try {
    if (!user?.email) return { sent: false, delivered: false, reason: "No user email" };
    const [smtpConfig, webmailAddress] = await Promise.all([getSmtpConfig(), getWebmailAddress()]);
    const brandName = smtpConfig.fromName || config.brandName || "Surokkha";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || webmailAddress || `no-reply@${config.domain || "surokkha.store"}`;
    const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
    const lines = [
      ["Name", user.name || "-"],
      ["Email", user.email],
      ["Role", user.role || "-"],
      ["Requested at", `${when} (Bangladesh time)`],
      ["IP", ip || "-"],
    ];
    const ok = Boolean(
      await copyToWebmailInbox({
        from: `"${brandName}" <${fromEmail}>`,
        to: webmailAddress || fromEmail,
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
      })
    );
    return ok
      ? { sent: true, delivered: true }
      : { sent: false, delivered: false, reason: "Webmail IMAP is not configured or copy failed" };
  } catch (error) {
    log.warn?.({ error, email: user?.email }, "Forgot password alert Webmail delivery failed");
    return { sent: false, delivered: false, reason: error.message };
  }
};
