import { BRAND, SANS, SERIF, esc, emailLayout, resolveSite } from "./surokkhaBrand.js";

// One-time password email (registration / password reset), styled like the Surokkha invoice
export const buildOtpEmailHtml = ({ name, otp, type = "registration", logoUrl, siteKey } = {}) => {
  const site = resolveSite({ site: siteKey });
  const isReset = type === "forgot-password";
  const heading = isReset ? "Reset your password" : "Verify your email";

  const body = `
    <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${BRAND.maroon};line-height:1.25">${heading}</div>
    <div style="font-family:${SANS};font-size:13.5px;color:${BRAND.muted};margin-top:6px">Hello ${esc(name || "there")}, use this one-time code to ${isReset ? "reset your password" : "finish verifying your account"}.</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;border-collapse:separate">
      <tr><td align="center" bgcolor="${BRAND.blush}" style="background:${BRAND.blush};border:1px solid ${BRAND.line};border-radius:12px;padding:22px 16px">
        <div style="font-family:${SANS};font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${BRAND.crimson};font-weight:700">Your code</div>
        <div style="font-family:${SANS};font-size:34px;font-weight:700;letter-spacing:10px;color:${BRAND.maroon};margin-top:6px">${esc(otp)}</div>
        <div style="font-family:${SANS};font-size:11.5px;color:${BRAND.muted};margin-top:6px">Expires in 10 minutes</div>
      </td></tr>
    </table>

    <div style="font-family:${SANS};font-size:12px;color:${BRAND.muted};margin-top:14px">If you didn't request this code, you can ignore this email. Never share it with anyone, including our team.</div>`;

  return emailLayout({
    title: `${heading} · ${site.name}`,
    preheader: `Your ${site.name} code is ${otp}`,
    logoUrl,
    site,
    body,
  });
};

export default { buildOtpEmailHtml };
