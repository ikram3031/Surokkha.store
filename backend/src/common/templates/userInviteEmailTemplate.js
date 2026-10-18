import { config } from '../config/index.js';

/**
 * Builds HTML email body for inviting staff users to the store dashboard
 */
export const renderUserInviteEmail = ({
  name,
  role,
  inviteUrl,
  brandName: customBrandName,
  logoUrl: customLogoUrl,
}) => {
  const brandName = customBrandName || config.brandName || '';
  const logoUrl = customLogoUrl || config.logoUrl || '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; padding: 28px; text-align: center; color: #ffffff;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: 40px; margin-bottom: 8px;" />` : `<h2 style="margin: 0; font-size: 22px; font-weight: 700;">${brandName}</h2>`}
        <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Store Administration Invitation</p>
      </div>
      <div style="padding: 32px 28px; color: #334155;">
        <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">You've Been Invited!</h3>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">
          Hello <strong>${name || 'Team Member'}</strong>,<br/>
          You have been invited to join <strong>${brandName}</strong> as a <strong>${role || 'Staff Member'}</strong>.
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
          Click the button below to accept your invitation, set up your password, and access your dashboard workspace.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Accept Invitation & Set Password</a>
        </div>
        <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">
          If the button above does not work, copy and paste this link into your browser:
        </p>
        <p style="margin: 0 0 24px; font-size: 11px; color: #64748b; word-break: break-all; font-family: monospace; background: #f8fafc; padding: 8px 12px; border-radius: 6px;">
          ${inviteUrl}
        </p>
        <p style="margin: 0; font-size: 12px; color: #ef4444;">
          ⏳ This invitation link is secure and valid for 48 hours.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </div>
    </div>
  `;
};

export const buildUserInviteEmailHtml = renderUserInviteEmail;
export default { renderUserInviteEmail, buildUserInviteEmailHtml };
