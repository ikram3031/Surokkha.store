/**
 * Renders a clean, modern White-Mode email template for User Invitations.
 * Optimized for high deliverability and cross-client compatibility (Gmail, Outlook, Apple Mail).
 *
 * @param {Object} params
 * @param {string} params.name - Invitee name
 * @param {string} params.role - Assigned role
 * @param {string} params.inviteUrl - Invitation acceptance URL
 * @param {string} [params.brandName] - Brand name (defaults to 'Surokkha')
 * @param {string} [params.logoUrl] - Surokkha Logo URL
 * @returns {string} HTML email string
 */
export function renderUserInviteEmail({
  name,
  role,
  inviteUrl,
  brandName = "Surokkha",
  logoUrl = "https://admin.surokkha.store/surokkha_logo.png",
}) {
  const currentYear = new Date().getFullYear();
  const safeBrand = brandName || "Surokkha";
  const finalName = name && name.trim() ? name.trim() : "Team Member";
  const finalRole = role && role.trim() ? role.trim() : "Dashboard User";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${safeBrand}</title>
  <style>
    /* Reset & Base */
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #0F172A;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #F8FAFC;
      padding: 36px 12px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      overflow: hidden;
      box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.06);
    }
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #881337 0%, #E11D48 50%, #FDA4AF 100%);
    }
    .header {
      padding: 32px 28px 24px 28px;
      text-align: center;
      background-color: #FFFFFF;
      border-bottom: 1px solid #F1F5F9;
    }
    .logo-img {
      max-height: 48px;
      height: 48px;
      width: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto 12px auto;
    }
    .header-badge {
      display: inline-block;
      padding: 4px 14px;
      background-color: #FFF1F2;
      color: #BE123C;
      border: 1px solid #FECDD3;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .content {
      padding: 32px 28px 28px 28px;
      background-color: #FFFFFF;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 14px 0;
      letter-spacing: -0.3px;
    }
    .lead-text {
      font-size: 14.5px;
      line-height: 1.65;
      color: #334155;
      margin: 0 0 20px 0;
    }
    .role-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #E11D48;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .role-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.75px;
      margin-bottom: 4px;
    }
    .role-value {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 24px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 36px;
      background-color: #E11D48;
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14.5px;
      border-radius: 10px;
      box-shadow: 0 4px 14px 0 rgba(225, 29, 72, 0.35);
      letter-spacing: 0.2px;
    }
    .notice {
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
      margin: 0 0 12px 0;
      text-align: center;
    }
    .link-fallback {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 14px;
      word-break: break-all;
      font-size: 11px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      line-height: 1.4;
      text-align: left;
    }
    .footer {
      padding: 24px 28px;
      text-align: center;
      background-color: #F8FAFC;
      border-top: 1px solid #F1F5F9;
      font-size: 12px;
      color: #94A3B8;
      line-height: 1.6;
    }
    .footer a {
      color: #E11D48;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Brand Color Stripe -->
      <div class="accent-bar"></div>

      <!-- Header with Surokkha Logo -->
      <div class="header">
        <img
          src="${logoUrl}"
          alt="${safeBrand}"
          class="logo-img"
        />
        <span class="header-badge">Team Invitation</span>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        <h1 class="greeting">Hello ${finalName},</h1>
        
        <p class="lead-text">
          You have been invited to join the <strong>${safeBrand}</strong> dashboard management portal. You will be able to manage orders, catalog, analytics, and operational tasks according to your role permissions.
        </p>

        <!-- Role Badge Box -->
        <div class="role-box">
          <div class="role-label">Assigned Role</div>
          <div class="role-value">${finalRole}</div>
        </div>

        <p class="lead-text" style="margin-bottom: 8px;">
          Please click the button below to accept your invitation, set up your secure password, and activate your account:
        </p>

        <!-- CTA Button -->
        <div class="btn-container">
          <a href="${inviteUrl}" class="btn" target="_blank" rel="noopener noreferrer">
            Accept Invitation &amp; Set Password
          </a>
        </div>

        <p class="notice">
          ⏳ This invitation link is valid for <strong>7 days</strong>.
        </p>

        <!-- Fallback Link -->
        <p class="notice" style="margin-top: 16px; margin-bottom: 6px; text-align: left;">
          If the button above does not work, copy and paste this link into your browser:
        </p>
        <div class="link-fallback">
          ${inviteUrl}
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          &copy; ${currentYear} <a href="https://admin.surokkha.store">${safeBrand}</a>. All rights reserved.
        </p>
        <p style="margin: 0; font-size: 11px; color: #94A3B8;">
          If you did not expect this invitation, please ignore this email or contact your administrator.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}
