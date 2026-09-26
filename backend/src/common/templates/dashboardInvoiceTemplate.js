/**
 * Dashboard-only printable invoice template — white background, A4 optimized.
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @returns {string} HTML string
 */
export const buildDashboardInvoiceHtml = ({
  order = {},
  logoUrl = "https://server.decantrebd.com/uploads/decantre_logo.png",
}) => {
  const {
    orderId = "N/A",
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
    paymentMethod = "N/A",
  } = order;

  const finalShipping = shippingAddress || billingAddress;

  const formatAddr = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    if (addr.fullAddress && addr.fullAddress.trim()) return addr.fullAddress;
    const parts = [
      addr.street,
      addr.thana || addr.state,
      addr.district || addr.city,
      (addr.zipCode || addr.zip) ? `Zip: ${addr.zipCode || addr.zip}` : '',
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const billingStr = formatAddr(billingAddress);
  const shippingStr = formatAddr(finalShipping);

  const isInStore = paymentMethod.toLowerCase().includes('instore') || paymentMethod.toLowerCase().includes('office');

  // Build item rows with alternate shading
  const itemRows = items.map((item, idx) => `
    <tr style="${idx % 2 === 1 ? 'background-color: #F9FAFB;' : ''}">
      <td style="padding: 10px 14px; font-size: 13px; color: #1F2937; border-bottom: 1px solid #E5E7EB; vertical-align: middle;">
        <strong>${item.productName}</strong>
        ${item.variantName ? `<br><span style="font-size: 11px; color: #6B7280;">Variant: ${item.variantName}</span>` : ''}
      </td>
      <td style="padding: 10px 14px; font-size: 13px; color: #374151; text-align: center; border-bottom: 1px solid #E5E7EB; vertical-align: middle;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 14px; font-size: 13px; color: #374151; text-align: right; border-bottom: 1px solid #E5E7EB; vertical-align: middle;">
        ৳${(item.price || 0).toFixed(2)}
      </td>
      <td style="padding: 10px 14px; font-size: 13px; color: #111827; font-weight: 600; text-align: right; border-bottom: 1px solid #E5E7EB; vertical-align: middle;">
        ৳${(item.subtotal || (item.price * item.quantity) || 0).toFixed(2)}
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Marcellus&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background-color: #F3F4F6;
      color: #1F2937;
      -webkit-font-smoothing: antialiased;
      padding: 32px 16px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
    }
    /* Dark header with golden logo */
    .invoice-header {
      background-color: #0A0A0A;
      padding: 28px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #FFFFFF;
    }
    .invoice-header .logo img {
      height: 28px;
      width: auto;
    }
    .invoice-header .invoice-label {
      font-family: 'Marcellus', serif;
      font-size: 26px;
      color: #C5A059;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    /* Body content */
    .invoice-body {
      padding: 36px 40px 28px;
    }
    /* Meta row: Invoice number, date, payment */
    .meta-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      gap: 20px;
    }
    .meta-block {
      flex: 1;
    }
    .meta-block.right {
      text-align: right;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9CA3AF;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 14px;
      color: #111827;
      font-weight: 600;
    }
    .meta-value.highlight {
      color: #C5A059;
      font-size: 16px;
    }
    /* Address sections */
    .address-grid {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
      padding: 20px 24px;
      background-color: #F9FAFB;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
    }
    .address-block {
      flex: 1;
    }
    .address-block h4 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9CA3AF;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .address-block p {
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
      margin: 0;
    }
    .address-block strong {
      color: #111827;
    }
    /* Items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table thead th {
      background-color: #F3F4F6;
      color: #6B7280;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 10px 14px;
      border-bottom: 2px solid #D1D5DB;
      border-top: 1px solid #E5E7EB;
    }
    /* Summary / Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .totals-table {
      width: 280px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 0;
      font-size: 13px;
    }
    .totals-table .label {
      color: #6B7280;
    }
    .totals-table .value {
      text-align: right;
      color: #111827;
      font-weight: 500;
    }
    .totals-table .total-row td {
      border-top: 2px solid #C5A059;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 700;
    }
    .totals-table .total-row .label {
      color: #111827;
    }
    .totals-table .total-row .value {
      color: #C5A059;
    }
    /* Footer */
    .invoice-footer {
      text-align: center;
      padding: 20px 40px;
      border-top: 1px solid #E5E7EB;
      background-color: #FAFAFA;
    }
    .invoice-footer p {
      font-size: 12px;
      color: #9CA3AF;
      margin: 4px 0;
    }
    .invoice-footer .thanks {
      font-family: 'Marcellus', serif;
      font-size: 15px;
      color: #374151;
      margin-bottom: 6px;
    }
    /* Print styles */
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    @media print {
      body {
        background-color: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-container {
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .invoice-body {
        padding: 24px 28px 20px !important;
      }
      .invoice-header {
        padding: 18px 28px !important;
      }
      .invoice-footer {
        padding: 14px 28px !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">

    <!-- Dark Header: Logo + INVOICE label -->
    <div class="invoice-header">
      <div class="logo">
        <img src="${logoUrl}" alt="Decantre" style="height: 28px; width: auto; display: block;" />
      </div>
      <div class="invoice-label">Invoice</div>
    </div>

    <!-- Body -->
    <div class="invoice-body">

      <!-- Invoice Meta -->
      <div class="meta-grid">
        <div class="meta-block">
          <div class="meta-label">Invoice Number</div>
          <div class="meta-value highlight">#${orderId}</div>
        </div>
        <div class="meta-block" style="text-align: center;">
          <div class="meta-label">Date</div>
          <div class="meta-value">${createdAt}</div>
        </div>
        <div class="meta-block right">
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">${paymentMethod}</div>
        </div>
      </div>

      <!-- Bill To / Ship To -->
      <div class="address-grid">
        <div class="address-block">
          <h4>Bill To</h4>
          <p>
            <strong>${customerName}</strong><br>
            ${billingStr}<br>
            ${customerPhone !== 'N/A' ? `Phone: ${customerPhone}<br>` : ''}
            ${customerEmail ? `${customerEmail}` : ''}
          </p>
        </div>
        <div class="address-block">
          <h4>Ship To</h4>
          <p>
            ${isInStore
              ? `<strong>🏢 Office Pickup (In-Store)</strong><br><span style="color: #6B7280; font-size: 11px;">Customer will pick up from Decantre Office.</span>`
              : `<strong>${(shippingAddress && shippingAddress.name) || customerName}</strong><br>
                ${shippingStr}<br>
                ${((shippingAddress && shippingAddress.phone) || customerPhone) !== 'N/A' ? `Phone: ${(shippingAddress && shippingAddress.phone) || customerPhone}` : ''}`
            }
          </p>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="text-align: left;">Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-section">
        <table class="totals-table" cellpadding="0" cellspacing="0">
          <tr>
            <td class="label">Subtotal</td>
            <td class="value">৳${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="label">Shipping</td>
            <td class="value">৳${shippingFee.toFixed(2)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td class="label">Discount ${couponCode ? `(${couponCode})` : ''}</td>
            <td class="value" style="color: #DC2626;">-৳${discountAmount.toFixed(2)}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td class="label">Total</td>
            <td class="value">৳${totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <p class="thanks">Thank you for your order</p>
      <p>&copy; ${new Date().getFullYear()} Decantre. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
};
