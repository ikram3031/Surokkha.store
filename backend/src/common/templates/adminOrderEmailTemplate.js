// Formats address object or string cleanly
const formatAddr = (addr) => {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr;
  const parts = [
    addr.street || addr.address,
    addr.thana,
    addr.district || addr.city || addr.state,
    addr.zipCode || addr.zip ? `Zip: ${addr.zipCode || addr.zip}` : ''
  ].filter(Boolean);
  return parts.join(', ');
};

// Builds admin new order notification email template with center-aligned typography hierarchy
export const buildAdminOrderEmailHtml = ({
  order = {},
  logoUrl = "https://admin.surokkha.store/surokkha_logo.png"
}) => {
  const cleanLogoUrl = (!logoUrl || !logoUrl.startsWith("http"))
    ? "https://admin.surokkha.store/surokkha_logo.png"
    : logoUrl;
  const {
    orderId = "3870",
    createdAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    customerName = "Customer",
    customerEmail = "",
    customerPhone = "N/A",
    billingAddress = {},
    shippingAddress = null,
    items = [],
    subtotal = 0,
    shippingFee = 0,
    discountAmount = 0,
    couponCode = null,
    totalAmount = 0,
    paymentMethod = "Cash on delivery",
  } = order;

  const finalShipping = shippingAddress || billingAddress;
  const billingStr = formatAddr(billingAddress);
  const shippingStr = formatAddr(finalShipping);
  const logoMarkup = `<img class="logo" src="${cleanLogoUrl}" alt="Surokkha" height="40" style="max-height: 40px; height: 40px; width: auto; max-width: 200px; object-fit: contain; display: block; margin: 0 auto; border: 0; outline: none;" />`;

  const itemRows = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #E2E8F0; ${idx % 2 === 1 ? 'background-color: #F8FAFC;' : 'background-color: #FFFFFF;'}">
      <td style="padding: 12px 15px; font-size: 13px; color: #334155; text-align: left; vertical-align: middle; font-family: 'Geist Mono', -apple-system, sans-serif;">
        <strong style="font-weight: 600; color: #0F172A;">${item.productName}</strong>
        ${item.variantName ? `<br><span style="font-size: 11px; color: #64748B;">Variant: ${item.variantName}</span>` : ''}
      </td>
      <td style="padding: 12px 15px; font-size: 13px; color: #475569; text-align: center; vertical-align: middle; font-family: 'Geist Mono', -apple-system, sans-serif;">
        ×${item.quantity}
      </td>
      <td style="padding: 12px 15px; font-size: 13px; color: #0F172A; font-weight: 600; text-align: right; vertical-align: middle; font-family: 'Geist Mono', -apple-system, sans-serif;">
        ৳ ${(item.subtotal || (item.price * item.quantity) || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surokkha - New Order #${orderId}</title>
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
    .notice-box {
      background-color: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 28px;
      font-size: 13px;
      color: #475569;
      font-family: 'Geist Mono', -apple-system, sans-serif;
      text-align: center;
    }
    .section-heading {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 18px;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 5px;
      font-weight: 600;
      text-align: center;
    }
    .sub-heading {
      font-size: 12px;
      color: #64748B;
      margin-top: 0;
      margin-bottom: 18px;
      font-family: 'Geist Mono', -apple-system, sans-serif;
      text-align: center;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      border: 1px solid #E2E8F0;
    }
    .items-table th {
      background-color: #F8FAFC;
      color: #0F172A;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 15px;
      border-bottom: 2px solid #E2E8F0;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .summary-table td {
      padding: 8px 12px;
      font-size: 13px;
      font-family: 'Geist Mono', -apple-system, sans-serif;
    }
    .summary-label {
      color: #475569;
    }
    .summary-val {
      color: #0F172A;
      font-weight: 600;
      text-align: right;
    }
    .total-row td {
      border-top: 2px solid #E2E8F0;
      padding-top: 12px;
    }
    .total-row .summary-label {
      color: #0F172A;
      font-weight: 700;
      font-size: 15px;
    }
    .total-row .summary-val {
      color: #0F172A;
      font-size: 18px;
      font-weight: 800;
    }
    .divider {
      height: 1px;
      background-color: #E2E8F0;
      margin: 30px 0;
    }
    .address-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .address-text {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
      margin: 0;
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
    @media only screen and (max-width: 480px) {
      .responsive-col {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <div class="header">
        ${logoMarkup}
      </div>

      <div class="content">
        <h1 class="title">You have received a new order</h1>
        
        <div class="notice-box">
          You have received a new order from <strong style="color: #0F172A;">${customerName}</strong>.
        </div>

        <h2 class="section-heading">Order summary</h2>
        <p class="sub-heading">Order #${orderId} (${createdAt})</p>

        <table class="items-table" cellpadding="0" cellspacing="0">
          <thead>
            <tr>
              <th style="text-align: left;">Product</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <table class="summary-table" cellpadding="0" cellspacing="0">
          <tr>
            <td class="summary-label">Subtotal:</td>
            <td class="summary-val">৳ ${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="summary-label">Shipping: Flat rate</td>
            <td class="summary-val">৳ ${shippingFee.toFixed(2)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td class="summary-label" style="color: #10B981;">Discount ${couponCode ? `(${couponCode})` : ''}:</td>
            <td class="summary-val" style="color: #10B981;">-৳ ${discountAmount.toFixed(2)}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td class="summary-label">Total:</td>
            <td class="summary-val">৳ ${totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="summary-label">Payment method:</td>
            <td class="summary-val" style="color: #334155; font-weight: normal;">${paymentMethod}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" class="responsive-col" style="vertical-align: top;">
              <h3 class="address-title">Billing address</h3>
              <p class="address-text">
                <strong style="color: #0F172A;">${billingAddress?.name || customerName}</strong><br>
                ${billingStr}<br>
                ${billingAddress?.phone || customerPhone}<br>
                ${billingAddress?.email || customerEmail ? `<a href="mailto:${billingAddress?.email || customerEmail}" style="color: #0F172A; text-decoration: none;">${billingAddress?.email || customerEmail}</a>` : ''}
              </p>
            </td>
            <td width="4%" class="responsive-col"></td>
            <td width="48%" class="responsive-col" style="vertical-align: top;">
              <h3 class="address-title">Shipping address</h3>
              <p class="address-text">
                <strong style="color: #0F172A;">${shippingAddress?.name || billingAddress?.name || customerName}</strong><br>
                ${shippingStr}<br>
                ${shippingAddress?.phone || billingAddress?.phone || customerPhone}
              </p>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 13px; font-weight: 600; color: #0F172A; margin: 0;">
            🎉 Congratulations on the sale!
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0 10px 0;" class="no-print">
          <a href="https://server.surokkha.store/api/v1/orders/${orderId}/invoice" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #0F172A; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 700; font-family: 'Geist Mono', sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
            📄 Download / Print Invoice PDF
          </a>
        </div>

      </div>

      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} <a href="https://surokkha.store">Surokkha.store</a>. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
};

export default { buildAdminOrderEmailHtml };
