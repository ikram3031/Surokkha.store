import { config } from '../config/index.js';

/**
 * Builds HTML email body for customer/member OTP codes
 */
export const buildOtpEmailHtml = ({
  name,
  otp,
  type = 'registration',
  brandName: customBrandName,
}) => {
  const brandName = customBrandName || config.brandName || 'Flexivia';
  const isForgotPassword = type === 'forgot-password';
  const heading = isForgotPassword ? 'Password Reset Verification' : 'Verify Your Email';
  const description = isForgotPassword
    ? `We received a request to reset your ${brandName} password. Use the verification code below to proceed:`
    : `Thank you for choosing ${brandName}. Please use the verification code below to complete your registration or login:`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${brandName}</h2>
      </div>
      <div style="padding: 32px 24px; text-align: center; color: #334155;">
        <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">${heading}</h3>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #64748b;">
          Hello <strong>${name || 'Valued Customer'}</strong>,<br/>
          ${description}
        </p>
        <div style="background: #f1f5f9; padding: 18px 24px; border-radius: 10px; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #0f172a; font-family: monospace; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="margin: 0 0 12px; font-size: 12px; color: #ef4444; font-weight: 600;">
          ⏳ This code is valid for 3 minutes.
        </p>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </div>
    </div>
  `;
};

export default { buildOtpEmailHtml };
