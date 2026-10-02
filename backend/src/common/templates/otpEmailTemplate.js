/**
 * Builds a professional HTML email template for OTP verification with center-aligned text hierarchy.
 * 
 * @param {Object} params
 * @param {string} params.name - The recipient's name
 * @param {string} params.otp - The One-Time Password
 * @param {string} [params.logoUrl="https://admin.surokkha.store/surokkha_logo.png"] - Public Surokkha logo URL
 * @returns {string} HTML email string
 */
export const buildOtpEmailHtml = ({
  name,
  otp,
  logoUrl = "https://admin.surokkha.store/surokkha_logo.png"
}) => {
  const cleanLogoUrl = (!logoUrl || !logoUrl.startsWith("http"))
    ? "https://admin.surokkha.store/surokkha_logo.png"
    : logoUrl;
  const finalName = name || "Valued Customer";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - Surokkha</title>
  <!-- Google Fonts Import -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Geist Mono', -apple-system, sans-serif;
      background-color: #F8FAFC;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F8FAFC;
      padding-top: 40px;
      padding-bottom: 40px;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #E2E8F0;
    }
    .header {
      background-color: #FFFFFF;
      padding: 32px 20px;
      text-align: center;
      border-bottom: 3px solid #E2E8F0;
    }
    .logo {
      vertical-align: middle;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
      line-height: 1.6;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 24px;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      text-align: center;
    }
    .greeting {
      font-size: 15px;
      color: #334155;
      margin-bottom: 15px;
      text-align: center;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .message-text {
      font-size: 14px;
      color: #475569;
      margin-bottom: 25px;
      text-align: center;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .otp-container {
      margin: 25px 0;
      padding: 22px 30px;
      background-color: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 6px;
      display: inline-block;
    }
    .otp-code {
      font-size: 34px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: 10px;
      margin: 0;
      padding-left: 10px;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .expiry-text {
      font-size: 13px;
      color: #64748B;
      margin-top: 15px;
      font-style: italic;
      text-align: center;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .security-notice {
      font-size: 12px;
      color: #94A3B8;
      border-top: 1px solid #E2E8F0;
      margin-top: 40px;
      padding-top: 20px;
      text-align: center;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .footer {
      background-color: #FFFFFF;
      padding: 30px 20px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .footer a {
      color: #0F172A;
      text-decoration: none;
      font-weight: 600;
    }
    .footer p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <div class="header">
        <img class="logo" src="${cleanLogoUrl}" alt="Surokkha" height="36" style="max-height: 36px; height: 36px; width: auto; max-width: 180px; object-fit: contain; display: block; margin: 0 auto; border: 0;" />
      </div>

      <!-- Main Body Content -->
      <div class="content">
        <h1 class="title">Verification Required</h1>
        <p class="greeting">Hello ${finalName},</p>
        <p class="message-text">
          Thank you for choosing Surokkha. To complete your verification, please use the One-Time Password (OTP) provided below:
        </p>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
        </div>
        
        <p class="expiry-text">This code will expire in 10 minutes.</p>
        
        <p class="security-notice">
          If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized activity.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} <a href="https://surokkha.store">Surokkha.store</a>. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
};
