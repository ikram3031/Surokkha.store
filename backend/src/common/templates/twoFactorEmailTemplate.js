import { config } from "../config/index.js";
import { BRAND, SANS, SERIF, esc, emailLayout, resolveSite } from "./surokkhaBrand.js";

// Two-factor authentication setup email; the QR image is attached by the caller as cid:qrcode
export const buildTwoFactorQrEmailHtml = ({ name, secret, brandName: customBrandName, logoUrl, siteKey } = {}) => {
  const site = resolveSite({ site: siteKey });
  const brandName = customBrandName || site.name || config.brandName;

  const body = `
    <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${BRAND.maroon};line-height:1.25">Secure your account</div>
    <div style="font-family:${SANS};font-size:13.5px;color:${BRAND.muted};margin-top:6px">Hello ${esc(name || "team member")}, scan this QR code with Google Authenticator, Authy or another authenticator app to turn on two-factor sign-in for the ${esc(brandName)} dashboard.</div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 18px;border-collapse:separate">
      <tr><td bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;padding:12px">
        <img src="cid:qrcode" alt="Two-factor setup QR code" width="200" height="200" style="display:block;width:200px;height:200px;border:0">
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
      <tr><td bgcolor="${BRAND.blush}" style="background:${BRAND.blush};border-radius:10px;padding:14px 16px">
        <div style="font-family:${SANS};font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${BRAND.crimson};font-weight:700">Can't scan? Enter this key</div>
        <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:15px;font-weight:700;letter-spacing:2px;color:${BRAND.maroon};margin-top:6px;word-break:break-all">${esc(secret)}</div>
      </td></tr>
    </table>

    <div style="font-family:${SANS};font-size:12px;color:${BRAND.crimson};margin-top:16px">If you didn't request this, contact your administrator and change your password right away.</div>`;

  return emailLayout({
    title: `Two-factor setup · ${brandName}`,
    preheader: "Scan the QR code to turn on two-factor sign-in.",
    logoUrl,
    site,
    body,
  });
};

export const buildTwoFactorEmailHtml = buildTwoFactorQrEmailHtml;
export default { buildTwoFactorQrEmailHtml, buildTwoFactorEmailHtml };
