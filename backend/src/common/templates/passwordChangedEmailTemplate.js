import { BRAND, SANS, SERIF, esc, emailLayout, resolveSite } from "./surokkhaBrand.js";

// Confirmation sent after a password is reset (by the member via OTP, or by an admin for staff)
export const buildPasswordChangedEmailHtml = ({ name, byAdmin = false, logoUrl, siteKey } = {}) => {
  const site = resolveSite({ site: siteKey });
  const when = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

  const body = `
    <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${BRAND.maroon};line-height:1.25">Your password was changed</div>
    <div style="font-family:${SANS};font-size:13.5px;color:${BRAND.muted};margin-top:6px">Hello ${esc(name || "there")}, ${byAdmin ? "an administrator reset the password for your account" : "the password for your account was just reset"}.</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;border-collapse:separate">
      <tr><td bgcolor="${BRAND.blush}" style="background:${BRAND.blush};border-radius:10px;padding:14px 16px;font-family:${SANS};font-size:13px;color:${BRAND.ink}">
        <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${BRAND.crimson};font-weight:700;margin-bottom:6px">Changed on</div>
        <div style="font-weight:600">${esc(when)} (Bangladesh time)</div>
      </td></tr>
    </table>

    <div style="font-family:${SANS};font-size:13px;color:${BRAND.ink};margin-top:16px">${byAdmin ? "Use the new password your administrator shared with you to sign in, then change it to one only you know." : "You can now sign in with your new password."}</div>
    <div style="font-family:${SANS};font-size:12px;color:${BRAND.crimson};margin-top:12px">Didn't do this? Contact us right away${site.helpline ? " on WhatsApp" : ""} so we can secure your account.</div>`;

  return emailLayout({
    title: `Password changed · ${site.name}`,
    preheader: `The password for your ${site.name} account was changed.`,
    logoUrl,
    site,
    body,
  });
};

export default { buildPasswordChangedEmailHtml };
