/**
 * Builds a professional dark/gold themed HTML email for 2FA QR code setup.
 * The QR code image is embedded as an inline attachment via CID reference.
 *
 * @param {Object} params
 * @param {string} params.name - Recipient's name
 * @param {string} params.secret - The raw TOTP secret key (for manual entry fallback)
 * @param {string} [params.logoUrl] - Public Decantre logo URL
 * @returns {string} HTML email string
 */
export const buildTwoFactorQrEmailHtml = ({
  name,
  secret,
  logoUrl = "https://server.decantrebd.com/uploads/logo_horizontal.png",
}) => {
  const finalName = name || "Dashboard User";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set Up Two-Factor Authentication</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Marcellus&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Geist Mono', monospace;
      background-color: #F5F5F5;
      color: #E4E4E7;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F5F5F5;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #121215;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      border: 1px solid #27272A;
    }

    /* Header */
    .header {
      background-color: #050505;
      padding: 32px 20px;
      text-align: center;
      border-bottom: 3px solid #C5A059;
    }

    /* Content area */
    .content {
      padding: 40px 36px;
      text-align: center;
      line-height: 1.7;
    }
    .title {
      font-family: 'Marcellus', serif;
      font-size: 22px;
      color: #FFFFFF;
      margin: 0 0 20px 0;
      letter-spacing: 1px;
    }
    .greeting {
      font-size: 15px;
      color: #E4E4E7;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 13px;
      color: #A1A1AA;
      margin-bottom: 30px;
    }

    /* QR Code box */
    .qr-wrapper {
      margin: 0 auto 28px auto;
      display: inline-block;
      padding: 16px;
      background-color: #FFFFFF;
      border-radius: 8px;
      border: 2px solid #C5A059;
    }
    .qr-wrapper img {
      display: block;
      width: 180px;
      height: 180px;
    }

    /* Step indicators */
    .steps-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #71717A;
      margin-bottom: 16px;
    }
    .steps {
      text-align: left;
      display: inline-block;
      margin: 0 auto 28px auto;
    }
    .step {
      font-size: 13px;
      color: #A1A1AA;
      margin-bottom: 8px;
      padding-left: 4px;
    }
    .step-num {
      color: #C5A059;
      font-weight: 700;
      margin-right: 6px;
    }

    /* Manual secret fallback */
    .secret-label {
      font-size: 12px;
      color: #71717A;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    .secret-box {
      margin: 0 auto 28px auto;
      padding: 14px 20px;
      background-color: #18181B;
      border: 1px dashed #C5A059;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #C5A059;
      word-break: break-all;
    }

    /* Security notice */
    .security-notice {
      font-size: 12px;
      color: #71717A;
      border-top: 1px solid #27272A;
      padding-top: 20px;
      margin-top: 8px;
    }

    /* Footer */
    .footer {
      background-color: #050505;
      padding: 26px 20px;
      text-align: center;
      font-size: 12px;
      color: #71717A;
      border-top: 1px solid #18181B;
    }
    .footer a {
      color: #C5A059;
      text-decoration: none;
    }
    .footer p {
      margin: 6px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- Header: Logo with gold accent border -->
      <div class="header">
        <img
          src="${logoUrl}"
          alt="Decantre"
          width="187"
          height="30"
          style="display:block; margin:0 auto; border:0; max-width:187px;"
        />
      </div>

      <!-- Main content -->
      <div class="content">
        <h1 class="title">Set Up Two-Factor Authentication</h1>
        <p class="greeting">Hello ${finalName},</p>
        <p class="subtitle">
          You have requested to set up Google Authenticator for your Decantre Dashboard (https://dashboard.decantrebd.com).
          Follow the steps below to secure your login.
        </p>

        <!-- QR Code -->
        <div class="qr-wrapper">
          <img src="cid:qrcode" alt="Google Authenticator QR Code" />
        </div>

        <!-- Steps -->
        <p class="steps-label">How to scan</p>
        <div class="steps">
          <p class="step"><span class="step-num">01.</span> Open the Google Authenticator app on your phone.</p>
          <p class="step"><span class="step-num">02.</span> Tap the <strong style="color:#E4E4E7;">+</strong> icon and choose <em>Scan a QR Code</em>.</p>
          <p class="step"><span class="step-num">03.</span> Point your camera at the QR code above.</p>
          <p class="step"><span class="step-num">04.</span> Enter the 6-digit code shown in the app when logging in.</p>
        </div>

        <!-- Manual entry fallback -->
        <p class="secret-label">Can't scan? Enter this key manually</p>
        <div class="secret-box">${secret}</div>

        <!-- Security notice -->
        <p class="security-notice">
          If you did not request this email, please change your password immediately
          and contact the Decantre support team. Do not share this QR code or key with anyone.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} <a href="https://decantrebd.com">Decantre</a>. All rights reserved.</p>
        <p>decantrebd.com &mdash; Dashboard Security Notification</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
};
