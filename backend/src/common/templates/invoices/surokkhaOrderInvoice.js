/**
 * Surokkha Personal Wellness Store — Order Complete Invoice & Email Template
 * Tailored specifically for authentic MO personal wellness products with 100% discreet packaging.
 * 
 * Design specifications:
 * - 100% Clean White background (#FFFFFF) - No dark blocks
 * - Centered Official Surokkha Logo
 * - Next Line: Bold Centered Invoice ID
 * - Next Line: Centered Status Badge (Order Confirmed)
 * - Clean structured metadata & itemized breakdown
 * - 100% Discreet packaging guarantee
 * - Clean light footer with official WhatsApp & support links
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {boolean} [params.isPrintView=false] - When true, triggers auto-print for PDF saving
 * @param {string} [params.logoUrl] - Public Surokkha Logo URL
 * @returns {string} Fully responsive, standalone HTML string
 */
export const buildSurokkhaOrderInvoiceHtml = ({
  order = {},
  isPrintView = false,
  logoUrl = "https://admin.surokkha.store/invoice_logo.png",
}) => {
  const cleanLogoUrl = (!logoUrl || !logoUrl.startsWith("http"))
    ? "https://admin.surokkha.store/invoice_logo.png"
    : logoUrl;

  const {
    orderId = "N/A",
    status = "processing",
    orderType = "online",
    createdAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    customerName = "Valued Customer",
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
    paymentMethod = "Cash on Delivery (COD)",
  } = order;

  const finalShipping = shippingAddress || billingAddress;

  // Formats address object or string cleanly
  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    if (addr.fullAddress && addr.fullAddress.trim()) return addr.fullAddress;
    const parts = [
      addr.street || addr.address,
      addr.thana,
      addr.district || addr.city || addr.state,
      addr.zipCode || addr.zip ? `Zip: ${addr.zipCode || addr.zip}` : "",
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const deliveryAddressStr = formatAddress(finalShipping);
  const isPaid = status === "completed" || paymentMethod.toLowerCase().includes("paid");
  const isCustom = orderType === "custom" || String(orderId).startsWith("CO");
  const isInstore = !isCustom && (orderType === "instore" || String(orderId).startsWith("IS") || paymentMethod.toLowerCase().includes("instore") || paymentMethod.toLowerCase().includes("office"));

  let statusBadgeText = isCustom ? "✓ CUSTOM ORDER" : "✓ ORDER CONFIRMED";
  let statusBadgeBg = isCustom ? "#FFFFFF" : "#FFFFFF";
  let statusBadgeColor = isCustom ? "#1D4ED8" : "#9F1239";
  let statusBadgeBorder = isCustom ? "#BFDBFE" : "#FECDD3";

  if (status === "completed" || isPaid) {
    statusBadgeText = "✓ ORDER COMPLETED";
    statusBadgeBg = "#FFFFFF";
    statusBadgeColor = "#166534";
    statusBadgeBorder = "#BBF7D0";
  } else if (status === "shipped") {
    statusBadgeText = "🚚 IN TRANSIT / SHIPPED";
    statusBadgeBg = "#FFFFFF";
    statusBadgeColor = "#3730A3";
    statusBadgeBorder = "#C7D2FE";
  } else if (status === "cancelled") {
    statusBadgeText = "✕ CANCELLED";
    statusBadgeBg = "#FFFFFF";
    statusBadgeColor = "#991B1B";
    statusBadgeBorder = "#FECACA";
  } else if (isInstore) {
    statusBadgeText = "🏢 IN-STORE ORDER";
    statusBadgeBg = "#FFFFFF";
    statusBadgeColor = "#92400E";
    statusBadgeBorder = "#FDE68A";
  }

  const paymentStatusText = isPaid || isInstore ? "Paid / Confirmed" : "Pending (COD)";
  const paymentStatusColor = isPaid || isInstore ? "#15803D" : "#BE123C";

  // Build product item rows
  const itemRowsHtml = items.map((item, index) => {
    const itemName = item.productName || item.name || "MO Wellness Product";
    const variantParts = [item.size, item.variant, item.variantName, item.packType].filter(Boolean);
    const variant = [...new Set(variantParts)].join(" • ") || item.variantName || item.size || "Standard Pack";
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const itemTotal = Number(item.subtotal || (unitPrice * qty) || 0);

    return `
      <tr style="background-color: #FFFFFF; border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; color: #0F172A; vertical-align: top;">
          <strong style="color: #0F172A; font-weight: 700; font-size: 14px;">${itemName}</strong>
          ${variant ? `<div style="font-size: 11.5px; color: #0F172A; font-weight: 600; margin-top: 3px;">✦ ${variant}</div>` : ""}
        </td>
        <td style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; color: #1E293B; text-align: center; vertical-align: top;">
          ${qty}
        </td>
        <td style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; color: #1E293B; text-align: right; vertical-align: top; white-space: nowrap;">
          ৳${unitPrice.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; color: #0F172A; font-weight: 700; text-align: right; vertical-align: top; white-space: nowrap;">
          ৳${itemTotal.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surokkha Invoice #${orderId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FFFFFF;
      color: #0F172A;
      margin: 0;
      padding: 24px 12px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
      max-width: 680px;
      width: 100%;
      min-height: calc(100vh - 80px);
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .brand-header-bar {
      height: 5px;
      background: #E2E8F0;
    }
    
    /* Centered Header Section */
    .invoice-header-center {
      padding: 32px 24px 24px 24px;
      text-align: center;
      background-color: #FFFFFF;
      border-bottom: 1px solid #F1F5F9;
    }
    .invoice-logo-img {
      max-height: 80px;
      height: 75px;
      width: auto;
      max-width: 360px;
      object-fit: contain;
      display: block;
      margin: 0 auto 16px auto;
    }
    .invoice-id-line {
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .invoice-id-line span {
      color: #0F172A;
    }
    .invoice-status-badge {
      display: inline-block;
      padding: 5px 16px;
      background-color: ${statusBadgeBg};
      color: ${statusBadgeColor};
      border: 1px solid ${statusBadgeBorder};
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.75px;
    }
    
    /* Meta Information Cards */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 24px 32px;
      background-color: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
    }
    .meta-card h4 {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.75px;
      margin-bottom: 8px;
    }
    .meta-card p {
      font-size: 13px;
      line-height: 1.5;
      color: #0F172A;
    }
    
    /* Items Section */
    .items-container {
      padding: 24px 32px;
      background-color: #FFFFFF;
      flex: 1 0 auto;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    .items-table th {
      background-color: #FFFFFF;
      color: #334155;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 16px;
      text-align: left;
    }
    .items-table th:first-child {
      border-top-left-radius: 8px;
    }
    .items-table th:last-child {
      border-top-right-radius: 8px;
    }
    .items-table th.text-center { text-align: center; }
    .items-table th.text-right { text-align: right; }
    
    .totals-container {
      margin-top: 20px;
      border-top: 2px solid #E2E8F0;
      padding-top: 14px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 0;
      font-size: 13.5px;
      color: #475569;
    }
    .totals-table td.amount {
      text-align: right;
      font-weight: 600;
      color: #1E293B;
    }
    .coupon-tag {
      display: inline-block;
      background: #DCFCE7;
      color: #166534;
      border: 1px dashed #86EFAC;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      font-family: monospace;
      letter-spacing: 0.5px;
      margin-left: 4px;
      vertical-align: middle;
    }
    .totals-table tr.grand-total td {
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
    }
    .totals-table tr.grand-total td.amount {
      color: #0F172A;
      font-size: 19px;
      font-weight: 800;
    }
    
    /* Discreet Packaging Notice Box */
    .discreet-notice-box {
      margin: 10px 32px 24px 32px;
      padding: 14px 18px;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .discreet-notice-box h5 {
      font-size: 12px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .discreet-notice-box p {
      font-size: 11.5px;
      color: #334155;
      line-height: 1.45;
    }
    
    /* Clean Light Footer */
    .invoice-footer-wrapper {
      margin-top: auto;
      width: 100%;
    }
    .invoice-footer-light {
      padding: 20px 32px;
      background-color: #FFFFFF;
      border-top: 1px solid #E2E8F0;
      color: #475569;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
    }
    .invoice-footer-light a {
      color: #0F172A;
      text-decoration: none;
      font-weight: 700;
    }
    .authenticity-seal {
      display: inline-block;
      margin-bottom: 8px;
      padding: 4px 14px;
      border: 1px solid #E2E8F0;
      border-radius: 9999px;
      color: #0F172A;
      background-color: #FFFFFF;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Action Buttons (Hidden on Print) */
    .actions-bar {
      max-width: 680px;
      margin: 16px auto 0 auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 10px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-print {
      background-color: #FFFFFF;
      color: #334155;
    }
    .btn-print:hover {
      background-color: #9F1239;
    }

    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        background-color: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
        height: 100% !important;
        min-height: 100% !important;
        width: 100% !important;
      }
      .invoice-wrapper {
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
        border-radius: 0 !important;
        min-height: calc(297mm - 14mm) !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        page-break-after: avoid;
        break-after: avoid;
      }
      .items-container {
        flex: 1 0 auto !important;
      }
      .invoice-footer-wrapper {
        margin-top: auto !important;
        width: 100% !important;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .actions-bar {
        display: none !important;
      }
      .invoice-logo-img {
        max-height: 75px !important;
        height: 70px !important;
        max-width: 340px !important;
        margin-bottom: 12px !important;
      }
    }
  </style>
</head>
<body ${isPrintView ? 'onload="setTimeout(function(){ window.print(); }, 400)"' : ""}>
  <div class="invoice-wrapper">
    <div class="brand-header-bar"></div>

    <!-- Centered Header Section -->
    <div class="invoice-header-center">
      <img
        src="${cleanLogoUrl}"
        alt="Surokkha"
        class="invoice-logo-img"
        height="75"
        style="max-height: 80px; height: 75px; width: auto; max-width: 360px; object-fit: contain; display: block; margin: 0 auto 16px auto; border: 0; outline: none;"
      />
      <div class="invoice-id-line">INVOICE <span>#${orderId}</span></div>
      <div>
        <span class="invoice-status-badge">${statusBadgeText}</span>
      </div>
    </div>

    <!-- Meta Information Cards -->
    <div class="meta-grid">
      <div class="meta-card">
        <h4>Customer & Delivery Details</h4>
        <p><strong>${customerName}</strong></p>
        <p style="color: #334155;">${customerPhone}</p>
        ${customerEmail ? `<p style="color: #334155; font-size: 12px;">${customerEmail}</p>` : ""}
        <p style="margin-top: 6px; font-size: 12.5px;"><strong>${isInstore ? 'Pickup Location:' : 'Shipping Address:'}</strong><br />${isInstore ? '🏢 Store Pickup' : deliveryAddressStr}</p>
      </div>
      
      <div class="meta-card">
        <h4>Order Summary & Payment</h4>
        <p><strong>Order Date:</strong> ${createdAt}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Payment Status:</strong> <span style="color: ${paymentStatusColor}; font-weight: 700;">${paymentStatusText}</span></p>
        <p style="margin-top: 6px; font-size: 12.5px;"><strong>Customer Helpline:</strong><br /><a href="https://wa.me/8801600905774" target="_blank" style="color: #0F172A; text-decoration: none; font-weight: 700;">01600905774</a> (WhatsApp Available)</p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="items-container">
      <table class="items-table">
        <thead>
          <tr>
            <th>Product & Pack Details</th>
            <th class="text-center" style="width: 60px;">Qty</th>
            <th class="text-right" style="width: 100px;">Unit Price</th>
            <th class="text-right" style="width: 100px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- Totals Table -->
      <div class="totals-container">
        <table class="totals-table">
          <tr>
            <td>Items Subtotal:</td>
            <td class="amount">৳${Number(subtotal).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Delivery Fee:</td>
            <td class="amount">${Number(shippingFee) > 0 ? `৳${Number(shippingFee).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '<span style="color: #0F172A; font-weight: 600;">Free</span>'}</td>
          </tr>
          ${Number(discountAmount) > 0 ? `
          <tr>
            <td style="color: #0F172A; font-weight: 600;">
              Discount ${couponCode ? `<span class="coupon-tag">${couponCode}</span>` : ""}:
            </td>
            <td class="amount" style="color: #0F172A; font-weight: 700;">-৳${Number(discountAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ""}
          <tr class="grand-total">
            <td>Grand Total (BDT):</td>
            <td class="amount">৳${Number(totalAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Bottom Footer Wrapper fixed at bottom -->
    <div class="invoice-footer-wrapper">
      <!-- Thank you message above footer -->
      <div style="padding: 16px 32px; text-align: center; font-size: 12.5px; color: #334155; border-top: 1px solid #F1F5F9; background-color: #FFFFFF;">
        Thank you for choosing <a href="https://surokkha.store" target="_blank" style="color: #0F172A; text-decoration: none; font-weight: 700;"><strong>Surokkha.store</strong></a> — Trusted Destination for Personal Wellness
      </div>

      <!-- Surokkha Clean Light Footer -->
      <div class="invoice-footer-light">
        <p style="font-size: 11.5px; color: #334155; margin: 0;">
          For questions or assistance, reach out via WhatsApp at <a href="https://wa.me/8801600905774" target="_blank" style="text-decoration: underline;">01600905774</a> or email <a href="mailto:support@surokkha.store">support@surokkha.store</a>.
        </p>
      </div>
    </div>
  </div>

  <div class="actions-bar">
    <button onclick="window.print()" class="btn-action btn-print">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>
`;
};
