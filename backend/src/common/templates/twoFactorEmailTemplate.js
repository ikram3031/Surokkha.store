/**
 * Builds a clean, professional White Mode HTML email for 2FA QR code setup.
 * The QR code image is embedded as an inline attachment via CID reference.
 *
 * @param {Object} params
 * @param {string} params.name - Recipient's name
 * @param {string} params.secret - The raw TOTP secret key (for manual entry fallback)
 * @param {string} [params.brandName] - Store / Brand name
 * @param {string} [params.logoUrl] - Public logo URL
 * @returns {string} HTML email string
 */
export const buildTwoFactorQrEmailHtml = ({
  name,
  secret,
  brandName = "Surokkha",
  logoUrl = "https://admin.surokkha.store/surokkha_logo.png",
}) => {
  const cleanLogoUrl = (!logoUrl || !logoUrl.startsWith("http"))
    ? "https://admin.surokkha.store/surokkha_logo.png"
    : logoUrl;
  const finalName = name || "Administrator";
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Up Two-Factor Authentication — ${brandName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #1E293B;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F8FAFC;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .header {
      background-color: #FFFFFF;
      padding: 32px 24px 24px 24px;
      text-align: center;
      border-bottom: 1px solid #F1F5F9;
    }
    .content {
      padding: 32px 28px;
      text-align: center;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #EFF6FF;
      color: #2563EB;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 12px 0;
      letter-spacing: -0.3px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 14px;
      color: #334155;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    .qr-wrapper {
      margin: 0 auto 24px auto;
      display: inline-block;
      padding: 16px;
      background-color: #FFFFFF;
      border-radius: 12px;
      border: 2px solid #E2E8F0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .qr-wrapper img {
      display: block;
      width: 180px;
      height: 180px;
      margin: 0 auto;
    }
    .steps-card {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 0 auto 24px auto;
      text-align: left;
    }
    .steps-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
      margin: 0 0 12px 0;
    }
    .step-item {
      font-size: 13px;
      color: #334155;
      margin-bottom: 8px;
      display: flex;
      align-items: flex-start;
      line-height: 1.4;
    }
    .step-item:last-child {
      margin-bottom: 0;
    }
    .step-num {
      display: inline-block;
      width: 20px;
      height: 20px;
      background-color: #E2E8F0;
      color: #0F172A;
      font-size: 11px;
      font-weight: 700;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .secret-section {
      margin: 0 auto 24px auto;
      text-align: center;
    }
    .secret-label {
      font-size: 12px;
      color: #334155;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .secret-box {
      display: inline-block;
      margin: 0 auto;
      padding: 12px 20px;
      background-color: #F1F5F9;
      border: 1px dashed #94A3B8;
      border-radius: 8px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #0F172A;
      word-break: break-all;
      user-select: all;
    }
    .security-notice {
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 12px;
      color: #92400E;
      text-align: left;
      line-height: 1.5;
    }
    .footer {
      background-color: #F8FAFC;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94A3B8;
      border-top: 1px solid #F1F5F9;
    }
    .footer a {
      color: #334155;
      text-decoration: underline;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Header with Logo -->
      <div class="header">
        <img
          src="${cleanLogoUrl}"
          alt="${brandName}"
          height="38"
          style="max-height: 38px; height: 38px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border: 0; outline: none;"
        />
      </div>

      <!-- Main Body -->
      <div class="content">
        <div class="badge">Security Protection</div>
        <h1 class="title">Two-Factor Authentication Setup</h1>
        <p class="greeting">Hello ${finalName},</p>
        <p class="subtitle">
          To protect your <strong>${brandName}</strong> administrative account from unauthorized access, please connect your Authenticator app.
        </p>

        <!-- QR Code Display -->
        <div class="qr-wrapper">
          <img src="cid:qrcode" alt="Authenticator QR Code" />
        </div>

        <!-- Setup Steps -->
        <div class="steps-card">
          <div class="steps-title">Quick Setup Steps</div>
          <div class="step-item">
            <span class="step-num">1</span>
            <span>Open <strong>Google Authenticator</strong> (or any TOTP app) on your mobile device.</span>
          </div>
          <div class="step-item">
            <span class="step-num">2</span>
            <span>Tap the <strong>+</strong> button and select <strong>Scan a QR code</strong>.</span>
          </div>
          <div class="step-item">
            <span class="step-num">3</span>
            <span>Point your camera at the QR code above.</span>
          </div>
          <div class="step-item">
            <span class="step-num">4</span>
            <span>Enter the generated 6-digit code on the dashboard login screen.</span>
          </div>
        </div>

        <!-- Manual Secret Key -->
        <div class="secret-section">
          <div class="secret-label">Can't scan the QR code? Enter this setup key manually:</div>
          <div class="secret-box">${secret}</div>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <strong>⚠️ Important Security Notice:</strong> Never share this QR code, key, or your 6-digit OTP with anyone. Surokkha staff will never ask for your 2FA credentials. If you did not initiate this login attempt, please secure your password immediately.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>&copy; ${year} ${brandName}. All rights reserved.</p>
        <p>Security & Authentication Services &bull; ${brandName} Administration</p>
      </div>

    </div>
  </div>
</body>
</html>`;
};
