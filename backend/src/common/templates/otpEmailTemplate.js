/**
 * Builds a professional, luxury dark/gold themed HTML email template for OTP verification with center-aligned text hierarchy.
 * 
 * @param {Object} params
 * @param {string} params.name - The recipient's name
 * @param {string} params.otp - The One-Time Password
 * @param {string} [params.logoUrl="https://server.decantrebd.com/uploads/logo_horizontal.png"] - Public Decantre logo URL
 * @returns {string} HTML email string
 */
export const buildOtpEmailHtml = ({
  name,
  otp,
  logoUrl = "https://server.decantrebd.com/uploads/logo_horizontal.png"
}) => {
  const finalName = name || "Valued Customer";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
  <!-- Google Fonts Import -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Marcellus&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Geist Mono';
      background-color: #F5F5F5;
      color: #E4E4E7;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F5F5F5;
      padding-top: 40px;
      padding-bottom: 40px;
      font-family: 'Geist Mono';
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #121215;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border: 1px solid #27272A;
    }
    .header {
      background-color: #050505;
      padding: 32px 20px;
      text-align: center;
      border-bottom: 3px solid #C5A059;
    }
    .logo {
      vertical-align: middle;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
      line-height: 1.6;
      font-family: 'Geist Mono';
    }
    .title {
      font-family: 'Marcellus';
      font-size: 24px;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 500;
      letter-spacing: 1px;
      text-align: center;
    }
    .greeting {
      font-size: 15px;
      color: #E4E4E7;
      margin-bottom: 15px;
      text-align: center;
      font-family: 'Geist Mono';
    }
    .message-text {
      font-size: 14px;
      color: #A1A1AA;
      margin-bottom: 25px;
      text-align: center;
      font-family: 'Geist Mono';
    }
    .otp-container {
      margin: 25px 0;
      padding: 22px 30px;
      background-color: #18181B;
      border: 1px dashed #C5A059;
      border-radius: 6px;
      display: inline-block;
    }
    .otp-code {
      font-size: 34px;
      font-weight: 700;
      color: #C5A059;
      letter-spacing: 10px;
      margin: 0;
      padding-left: 10px;
      font-family: 'Geist Mono';
    }
    .expiry-text {
      font-size: 13px;
      color: #A1A1AA;
      margin-top: 15px;
      font-style: italic;
      text-align: center;
      font-family: 'Geist Mono';
    }
    .security-notice {
      font-size: 12px;
      color: #71717A;
      border-top: 1px solid #27272A;
      margin-top: 40px;
      padding-top: 20px;
      text-align: center;
      font-family: 'Geist Mono';
    }
    .footer {
      background-color: #050505;
      padding: 30px 20px;
      text-align: center;
      font-size: 12px;
      color: #A1A1AA;
      border-top: 1px solid #18181B;
      font-family: 'Geist Mono';
    }
    .footer a {
      color: #C5A059;
      text-decoration: none;
    }
    .footer p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Black Header with Gold Accent Line & Logo -->
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Decantre" width="187.5" height="30" style="width: 187.5px; height: 30px; max-width: 187.5px; max-height: 30px; display: block; margin: 0 auto; border: 0;" />
      </div>

      <!-- Main Body Content -->
      <div class="content">
        <h1 class="title">Verification Required</h1>
        <p class="greeting">Hello ${finalName},</p>
        <p class="message-text">
          Thank you for choosing Decantre. To complete your verification, please use the One-Time Password (OTP) provided below:
        </p>
        
        <!-- Gold Accent OTP Card Box -->
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
        </div>
        
        <p class="expiry-text">This code will expire in 10 minutes.</p>
        
        <p class="security-notice">
          If you did not request this verification code, please ignore this email or contact support if you suspect unauthorized activity.
        </p>
      </div>

      <!-- Dark Footer -->
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} <a href="https://decantrebd.com">Decantre</a>. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
};
