export function renderUserInviteEmail({ name, role, inviteUrl, brandName }) {
  const currentYear = new Date().getFullYear();
  const safeBrand = brandName || "Store Dashboard";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${safeBrand}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 30px 15px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 540px;
      margin: 0 auto;
      background-color: #1e293b;
      border-radius: 16px;
      border: 1px solid #334155;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 32px 28px 24px;
      text-align: center;
      border-bottom: 1px solid #334155;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .content {
      padding: 32px 28px;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 16px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 20px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #0284c7;
      color: #ffffff;
      font-weight: 600;
      font-size: 12px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background-color: #38bdf8;
      color: #0f172a !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 14px 0 rgba(56, 189, 248, 0.39);
    }
    .link-fallback {
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      word-break: break-all;
      font-size: 11px;
      color: #94a3b8;
      font-family: monospace;
    }
    .footer {
      padding: 20px 28px;
      text-align: center;
      background-color: #0f172a;
      border-top: 1px solid #334155;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand-title">${safeBrand}</h1>
    </div>
    <div class="content">
      <h2>Hello ${name || 'there'},</h2>
      <p>You have been invited to join the <strong>${safeBrand}</strong> dashboard management team.</p>
      
      <div>
        <span class="badge">Assigned Role: ${role || 'Marketing Expert'}</span>
      </div>

      <p>Please click the button below to set up your password and activate your account:</p>

      <div class="btn-container">
        <a href="${inviteUrl}" class="btn" target="_blank">Accept Invitation & Set Password</a>
      </div>

      <p style="font-size: 12px; color: #94a3b8;">If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="link-fallback">
        ${inviteUrl}
      </div>
    </div>
    <div class="footer">
      &copy; ${currentYear} ${safeBrand}. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
}
