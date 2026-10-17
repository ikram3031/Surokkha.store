import { config } from '../config/index.js';

/**
 * Builds HTML email body for Two-Factor Authentication (2FA) setup with embedded QR Code
 */
export const buildTwoFactorQrEmailHtml = ({
  name,
  secret,
  brandName: customBrandName,
}) => {
  const brandName = customBrandName || config.brandName || '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${brandName} Dashboard</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Two-Factor Authentication Setup</p>
      </div>
      <div style="padding: 32px 24px; text-align: center; color: #334155;">
        <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">Secure Your Account</h3>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #64748b;">
          Hello <strong>${name || 'Staff Member'}</strong>,<br/>
          Scan the QR code below using <strong>Google Authenticator</strong>, <strong>Authy</strong>, or your preferred authenticator app to enable Two-Factor Authentication.
        </p>
        
        <div style="margin: 0 auto 20px; display: inline-block; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <img src="cid:qrcode" alt="2FA Setup QR Code" style="display: block; width: 200px; height: 200px;" />
        </div>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: left;">
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Can't scan the QR code? Enter manual key:</p>
          <code style="font-family: monospace; font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: 2px; word-break: break-all;">${secret}</code>
        </div>

        <p style="margin: 0; font-size: 12px; color: #ef4444; font-weight: 500;">
          ⚠️ If you did not request this setup, please contact your administrator or change your account password immediately.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © ${new Date().getFullYear()} ${brandName}. Secure Store Administration.
      </div>
    </div>
  `;
};

export const buildTwoFactorEmailHtml = buildTwoFactorQrEmailHtml;
export default { buildTwoFactorQrEmailHtml, buildTwoFactorEmailHtml };
