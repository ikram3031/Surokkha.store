import { config } from "../config/index.js";
import { BRAND, SANS, SERIF, esc, emailLayout, button, resolveSite } from "./surokkhaBrand.js";

// Staff invitation email, styled like the Surokkha invoice
export const renderUserInviteEmail = ({ name, role, inviteUrl, brandName: customBrandName, logoUrl: customLogoUrl } = {}) => {
  const site = resolveSite();
  const brandName = customBrandName || config.brandName || site.name;
  const logoUrl = customLogoUrl || config.logoUrl || "";

  const body = `
    <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:${BRAND.maroon};line-height:1.25">You've been invited</div>
    <div style="font-family:${SANS};font-size:13.5px;color:${BRAND.muted};margin-top:6px">Hello ${esc(name || "there")}, you've been invited to join <b style="color:${BRAND.ink}">${esc(brandName)}</b> as <b style="color:${BRAND.ink}">${esc(role || "Staff Member")}</b>. Accept the invitation to set your password and open the dashboard.</div>

    ${button(inviteUrl, "Accept invitation & set password")}

    <div style="font-family:${SANS};font-size:11.5px;color:${BRAND.muted};margin-top:18px">If the button doesn't work, paste this link into your browser:</div>
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:11px;color:${BRAND.maroon2};background:${BRAND.blush};border-radius:8px;padding:8px 12px;margin-top:6px;word-break:break-all">${esc(inviteUrl)}</div>
    <div style="font-family:${SANS};font-size:12px;color:${BRAND.crimson};margin-top:14px">This invitation link is valid for 48 hours.</div>`;

  return emailLayout({
    title: `Invitation to ${brandName}`,
    preheader: `You've been invited to join ${brandName}.`,
    logoUrl,
    site,
    body,
  });
};

export const buildUserInviteEmailHtml = renderUserInviteEmail;
export default { renderUserInviteEmail, buildUserInviteEmailHtml };
