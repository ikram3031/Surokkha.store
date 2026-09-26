/**
 * Customer Order Confirmation Email Template with center-aligned typography hierarchy.
 * 
 * @param {Object} params
 * @param {Object} params.order - The order details
 * @param {string} [params.logoUrl="https://server.decantrebd.com/uploads/logo_horizontal.png"] - Public Decantre Logo URL
 * @returns {string} HTML string
 */
export const buildOrderInvoiceEmailHtml = ({
  order = {},
  logoUrl = "https://server.decantrebd.com/uploads/decantre_logo.png",
  isPrintView = false
}) => {
  const {
    orderId = "3870",
    createdAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    customerName = "Ikramul Hoque",
    customerEmail = "metalhead.developer@gmail.com",
    customerPhone = "+880 1712-345678",
    billingAddress = {
      street: "House 45, Road 11, Sector 4",
      city: "Uttara",
      state: "Dhaka",
      zipCode: "1230"
    },
    shippingAddress = null,
    items = [
      {
        productName: "Sauvage Elixir Eau De Parfum",
        variantName: "10ml Decant",
        quantity: 2,
        price: 1850,
        subtotal: 3700
      },
      {
        productName: "Baccarat Rouge 540 Extrait",
        variantName: "5ml Decant",
        quantity: 1,
        price: 2400,
        subtotal: 2400
      }
    ],
    subtotal = 6100,
    shippingFee = 100,
    discountAmount = 0,
    couponCode = null,
    totalAmount = 6200,
    paymentMethod = "Cash on delivery",
  } = order;

  const finalShipping = shippingAddress || billingAddress;

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

  const billingStr = formatAddr(billingAddress);
  const shippingStr = formatAddr(finalShipping);

  // Exact 1250x200 Aspect Ratio (6.25:1) => width: 187.5px, height: 30px
  const logoMarkup = `<img class="logo" src="${logoUrl}" alt="Decantre Dev" width="187.5" height="30" style="width: 187.5px; height: 30px; max-width: 187.5px; max-height: 30px; display: block; margin: 0 auto; border: 0; outline: none;" />`;

  const itemRows = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #27272A; ${idx % 2 === 1 ? 'background-color: #18181B;' : 'background-color: #121215;'}">
      <td style="padding: 12px 15px; font-size: 13px; color: #E4E4E7; text-align: left; vertical-align: middle; font-family: 'Geist Mono';">
        <strong style="font-weight: 600; color: #FFFFFF;">${item.productName}</strong>
        ${item.variantName ? `<br><span style="font-size: 11px; color: #A1A1AA;">Variant: ${item.variantName}</span>` : ''}
      </td>
      <td style="padding: 12px 15px; font-size: 13px; color: #D4D4D8; text-align: center; vertical-align: middle; font-family: 'Geist Mono';">
        ×${item.quantity}
      </td>
      <td style="padding: 12px 15px; font-size: 13px; color: #C5A059; font-weight: 600; text-align: right; vertical-align: middle; font-family: 'Geist Mono';">
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
  <title>Invoice-${orderId}</title>
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
    .notice-box {
      background-color: #18181B;
      border: 1px dashed #C5A059;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 28px;
      font-size: 13px;
      color: #D4D4D8;
      font-family: 'Geist Mono';
      text-align: center;
    }
    .section-heading {
      font-family: 'Marcellus';
      font-size: 18px;
      color: #C5A059;
      margin-top: 0;
      margin-bottom: 5px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .sub-heading {
      font-size: 12px;
      color: #A1A1AA;
      margin-top: 0;
      margin-bottom: 18px;
      font-family: 'Geist Mono';
      text-align: center;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      border: 1px solid #27272A;
    }
    .items-table th {
      background-color: #050505;
      color: #C5A059;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 12px 15px;
      border-bottom: 2px solid #C5A059;
      font-family: 'Geist Mono';
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      font-family: 'Geist Mono';
    }
    .summary-table td {
      padding: 8px 12px;
      font-size: 13px;
      font-family: 'Geist Mono';
    }
    .summary-label {
      color: #A1A1AA;
    }
    .summary-val {
      color: #FFFFFF;
      font-weight: 600;
      text-align: right;
    }
    .total-row td {
      border-top: 2px solid #C5A059;
      padding-top: 12px;
    }
    .total-row .summary-label {
      color: #FFFFFF;
      font-weight: 700;
      font-size: 15px;
    }
    .total-row .summary-val {
      color: #C5A059;
      font-size: 18px;
      font-weight: 700;
    }
    .divider {
      height: 1px;
      background-color: #27272A;
      margin: 30px 0;
    }
    .address-title {
      font-family: 'Marcellus';
      font-size: 16px;
      color: #C5A059;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .address-text {
      font-size: 12px;
      color: #A1A1AA;
      line-height: 1.6;
      margin: 0;
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
    @media only screen and (max-width: 480px) {
      .responsive-col {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 20px !important;
      }
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body, .wrapper {
        background-color: #FFFFFF !important;
        color: #000000 !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .container {
        border: none !important;
        box-shadow: none !important;
        background-color: #FFFFFF !important;
        color: #000000 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .header {
        background-color: #FFFFFF !important;
        border-bottom: 2px solid #C5A059 !important;
        padding: 15px 0 !important;
      }
      .content {
        padding: 15px !important;
      }
      .title {
        color: #000000 !important;
        font-size: 20px !important;
        margin-bottom: 10px !important;
      }
      .greeting, .message-text {
        color: #000000 !important;
        margin-bottom: 10px !important;
      }
      .notice-box {
        background-color: #F9F9FB !important;
        border: 1px solid #C5A059 !important;
        color: #000000 !important;
        padding: 10px !important;
        margin-bottom: 15px !important;
      }
      .items-table {
        margin-bottom: 15px !important;
      }
      .items-table th {
        background-color: #F4F4F5 !important;
        color: #000000 !important;
        border-bottom: 1px solid #C5A059 !important;
        padding: 8px !important;
      }
      .items-table td {
        padding: 8px !important;
        color: #000000 !important;
        background-color: #FFFFFF !important;
      }
      .summary-table {
        margin-bottom: 15px !important;
      }
      .summary-table td {
        padding: 5px 8px !important;
      }
      .summary-val {
        color: #000000 !important;
      }
      .total-row td {
        border-top: 1px solid #C5A059 !important;
      }
      .total-row .summary-val {
        color: #C5A059 !important;
      }
      .divider {
        margin: 15px 0 !important;
        background-color: #E4E4E7 !important;
      }
      .address-title {
        color: #C5A059 !important;
        margin-bottom: 4px !important;
      }
      .address-text {
        color: #3F3F46 !important;
      }
      .footer {
        background-color: #FFFFFF !important;
        border-top: 1px solid #E4E4E7 !important;
        color: #71717A !important;
        padding: 15px 0 !important;
      }
      @page {
        size: A4;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Black Header with Gold Accent Line & Logo -->
      <div class="header">
        ${logoMarkup}
      </div>

      <!-- Main Body Content -->
      <div class="content">
        
        <h1 class="title">Thank you for your order</h1>
        
        <p class="greeting">Hello ${customerName},</p>
        <p class="message-text">Just to let you know — we've received your order, and it is now being processed.</p>

        <!-- Gold Accent Notice Box -->
        <div class="notice-box">
          <strong style="color: #C5A059;">Here's a reminder of what you've ordered:</strong><br>
          <span style="color: #E4E4E7; margin-top: 4px; display: inline-block;">
            ${paymentMethod.toLowerCase().includes('cash') ? 'Pay with cash upon delivery.' : `Payment via ${paymentMethod}.`}
          </span>
        </div>

        <!-- Order Summary Title -->
        <h2 class="section-heading">Order summary</h2>
        <p class="sub-heading">Order #${orderId} (${createdAt})</p>

        <!-- Items Table -->
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

        <!-- Calculation Summary -->
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
            <td class="summary-val" style="color: #A1A1AA; font-weight: normal;">${paymentMethod}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <!-- Addresses Grid -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" class="responsive-col" style="vertical-align: top;">
              <h3 class="address-title">Billing address</h3>
              <p class="address-text">
                <strong style="color: #FFFFFF;">${billingAddress?.name || customerName}</strong><br>
                ${billingStr}<br>
                ${billingAddress?.phone || customerPhone}<br>
                ${billingAddress?.email || customerEmail ? `<a href="mailto:${billingAddress?.email || customerEmail}" style="color: #C5A059; text-decoration: none;">${billingAddress?.email || customerEmail}</a>` : ''}
              </p>
            </td>
            <td width="4%" class="responsive-col"></td>
            <td width="48%" class="responsive-col" style="vertical-align: top;">
              <h3 class="address-title">Shipping address</h3>
              <p class="address-text">
                <strong style="color: #FFFFFF;">${shippingAddress?.name || billingAddress?.name || customerName}</strong><br>
                ${shippingStr}<br>
                ${shippingAddress?.phone || billingAddress?.phone || customerPhone}
              </p>
            </td>
          </tr>
        </table>

        <!-- Download / Print Invoice PDF CTA -->
        <div style="text-align: center; margin: 30px 0 10px 0;" class="no-print">
          <a href="https://server.decantrebd.com/api/v1/orders/${orderId}/invoice" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #C5A059; color: #000000; text-decoration: none; border-radius: 6px; font-weight: 700; font-family: 'Geist Mono', sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(197, 160, 89, 0.25);">
            📄 Download / Print Invoice PDF
          </a>
        </div>

      </div>

      <!-- Dark Footer -->
      <div class="footer">
        <p>Thanks for shopping with us!</p>
        <p>&copy; ${new Date().getFullYear()} <a href="https://decantrebd.com">Decantre Dev</a>. All rights reserved. <span style="color: #C5A059; font-size: 10px;">[TEST]</span></p>
      </div>

    </div>
  </div>
  ${isPrintView ? `<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => window.print(), 600); });</script>` : ''}
</body>
</html>
  `;
};
