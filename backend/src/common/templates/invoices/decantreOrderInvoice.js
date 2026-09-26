/**
 * Decantre Luxury Perfume Store — Order Complete Invoice Template
 * Tailored specifically for authentic niche/designer perfume decants & full bottles.
 * 
 * Features:
 * - Luxury gold & obsidian theme (#C5A059 / #0F172A)
 * - Decant size & concentration specifications
 * - Authenticity Guarantee seal
 * - Fragrance resting & storage care instructions
 * - 1-Page A4 print optimization + full HTML email client compatibility
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {boolean} [params.isPrintView=false] - When true, triggers auto-print for PDF saving
 * @param {string} [params.logoUrl] - Public Decantre Logo URL
 * @returns {string} Fully responsive, standalone HTML string
 */
export const buildDecantreOrderInvoiceHtml = ({
  order = {},
  isPrintView = false,
  logoUrl = "https://server.decantrebd.com/uploads/decantre_logo.png",
}) => {
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
  const isInstore = orderType === "instore" || String(orderId).startsWith("IS") || paymentMethod.toLowerCase().includes("instore") || paymentMethod.toLowerCase().includes("office");

  let statusBadgeText = "✓ Order Processing";
  let statusBadgeBg = "#FEF3C7";
  let statusBadgeColor = "#92400E";
  let statusBadgeBorder = "#FDE68A";

  if (status === "completed" || isPaid) {
    statusBadgeText = "✓ Order Completed";
    statusBadgeBg = "#DCFCE7";
    statusBadgeColor = "#166534";
    statusBadgeBorder = "#BBF7D0";
  } else if (status === "shipped") {
    statusBadgeText = "🚚 In Transit / Shipped";
    statusBadgeBg = "#E0E7FF";
    statusBadgeColor = "#3730A3";
    statusBadgeBorder = "#C7D2FE";
  } else if (status === "cancelled") {
    statusBadgeText = "✕ Cancelled";
    statusBadgeBg = "#FEE2E2";
    statusBadgeColor = "#991B1B";
    statusBadgeBorder = "#FECACA";
  } else if (isInstore) {
    statusBadgeText = "🏢 In-Store Order";
    statusBadgeBg = "#FEF3C7";
    statusBadgeColor = "#92400E";
    statusBadgeBorder = "#FDE68A";
  }

  const paymentStatusText = isPaid || isInstore ? "Paid / Confirmed" : "Pending (COD)";
  const paymentStatusColor = isPaid || isInstore ? "#15803D" : "#D97706";

  // Build item rows
  const itemRowsHtml = items.map((item, index) => {
    const isEven = index % 2 === 1;
    const itemName = item.productName || item.name || "Fragrance Decant";
    const variantParts = [item.size, item.concentration, item.variant, item.variantName].filter(Boolean);
    const variant = [...new Set(variantParts)].join(" • ") || item.variantName || item.size || "";
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const itemTotal = Number(item.subtotal || (unitPrice * qty) || 0);

    return `
      <tr style="background-color: ${isEven ? "#F9FAFB" : "#FFFFFF"}; border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px 14px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #111827; vertical-align: top;">
          <strong style="color: #0F172A; font-weight: 600; font-size: 13.5px;">${itemName}</strong>
          ${variant ? `<div style="font-size: 11.5px; color: #B89343; font-weight: 600; margin-top: 2px;">✦ ${variant}</div>` : ""}
        </td>
        <td style="padding: 12px 14px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #374151; text-align: center; vertical-align: top;">
          ${qty}
        </td>
        <td style="padding: 12px 14px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #374151; text-align: right; vertical-align: top; white-space: nowrap;">
          ৳${unitPrice.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px 14px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #0F172A; font-weight: 700; text-align: right; vertical-align: top; white-space: nowrap;">
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
  <title>Decantre Invoice #${orderId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8FAFC;
      color: #0F172A;
      margin: 0;
      padding: 24px 12px;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
      max-width: 680px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);
    }
    .gold-header-bar {
      height: 6px;
      background: linear-gradient(90deg, #99732B 0%, #C5A059 50%, #E8CD8C 100%);
    }
    .invoice-header {
      padding: 28px 32px 20px 32px;
      border-bottom: 1px solid #F1F5F9;
    }
    .brand-title {
      font-family: 'Cinzel', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #0F172A;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748B;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .invoice-status-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: ${statusBadgeBg};
      color: ${statusBadgeColor};
      border: 1px solid ${statusBadgeBorder};
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      padding: 24px 32px;
      background-color: #FAFAFA;
      border-bottom: 1px solid #F1F5F9;
    }
    .meta-card h4 {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.75px;
      margin-bottom: 6px;
    }
    .meta-card p {
      font-size: 13px;
      line-height: 1.45;
      color: #1E293B;
    }
    .items-container {
      padding: 24px 32px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .items-table th {
      background-color: #0F172A;
      color: #F8FAFC;
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }
    .items-table th.text-center { text-align: center; }
    .items-table th.text-right { text-align: right; }
    
    .totals-container {
      margin-top: 20px;
      border-top: 2px solid #0F172A;
      padding-top: 14px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 290px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 5px 0;
      font-size: 13px;
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
      padding-top: 10px;
      border-top: 1px solid #E2E8F0;
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
    }
    .totals-table tr.grand-total td.amount {
      color: #B89343;
      font-size: 17px;
      font-weight: 800;
    }
    
    /* Decant Care Box */
    .decant-care-box {
      margin: 24px 32px;
      padding: 14px 18px;
      background-color: #FEFCE8;
      border: 1px solid #FEF08A;
      border-radius: 8px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .decant-care-box h5 {
      font-size: 12px;
      font-weight: 700;
      color: #854D0E;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .decant-care-box p {
      font-size: 11.5px;
      color: #713F12;
      line-height: 1.4;
    }
    
    .invoice-footer {
      padding: 24px 32px;
      background-color: #0F172A;
      color: #94A3B8;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
    }
    .invoice-footer a {
      color: #E8CD8C;
      text-decoration: none;
      font-weight: 600;
    }
    .authenticity-seal {
      display: inline-block;
      margin-bottom: 8px;
      padding: 3px 10px;
      border: 1px solid #C5A059;
      border-radius: 4px;
      color: #E8CD8C;
      font-size: 10px;
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
      padding: 10px 18px;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-print {
      background-color: #0F172A;
      color: #FFFFFF;
    }
    .btn-print:hover {
      background-color: #1E293B;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background-color: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .invoice-wrapper {
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      .actions-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body ${isPrintView ? 'onload="setTimeout(function(){ window.print(); }, 400)"' : ""}>
  <div class="invoice-wrapper">
    <div class="gold-header-bar"></div>

    <!-- Header Section -->
    <div class="invoice-header">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Decantre" style="height: 38px; width: auto; max-width: 160px; object-fit: contain; margin-bottom: 4px;" />` : `<div class="brand-title">DECANTRE</div>`}
            <div class="brand-subtitle">Luxury Fragrance Decants • Bangladesh</div>
          </td>
          <td style="text-align: right; vertical-align: middle;">
            <div style="font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">INVOICE</div>
            <div style="font-size: 13px; font-weight: 700; color: #B89343; margin-top: 2px;">#${orderId}</div>
            <div style="margin-top: 6px;">
              <span class="invoice-status-badge">${statusBadgeText}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Meta Information Cards -->
    <div class="meta-grid">
      <div class="meta-card">
        <h4>Customer & Delivery Details</h4>
        <p><strong>${customerName}</strong></p>
        <p style="color: #64748B;">${customerPhone}</p>
        ${customerEmail ? `<p style="color: #64748B; font-size: 12px;">${customerEmail}</p>` : ""}
        <p style="margin-top: 6px; font-size: 12.5px;"><strong>${isInstore ? 'Pickup Location:' : 'Shipping Address:'}</strong><br />${isInstore ? '🏢 Decantre Store / Office Pickup' : deliveryAddressStr}</p>
      </div>
      
      <div class="meta-card">
        <h4>Order Summary & Payment</h4>
        <p><strong>Order Date:</strong> ${createdAt}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p><strong>Payment Status:</strong> <span style="color: ${paymentStatusColor}; font-weight: 700;">${paymentStatusText}</span></p>
        <p style="margin-top: 6px; font-size: 12.5px;"><strong>Store Helpline:</strong><br />01869151550 (WhatsApp Available)</p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="items-container">
      <table class="items-table">
        <thead>
          <tr>
            <th>Product & Decant Details</th>
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
            <td class="amount">${Number(shippingFee) > 0 ? `৳${Number(shippingFee).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '<span style="color: #15803D; font-weight: 600;">Free</span>'}</td>
          </tr>
          ${Number(discountAmount) > 0 ? `
          <tr>
            <td style="color: #15803D; font-weight: 600;">
              Discount ${couponCode ? `<span class="coupon-tag">${couponCode}</span>` : ""}:
            </td>
            <td class="amount" style="color: #15803D; font-weight: 700;">-৳${Number(discountAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>` : ""}
          <tr class="grand-total">
            <td>Grand Total:</td>
            <td class="amount">৳${Number(totalAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Decant Care & Rest Notice -->
    <div class="decant-care-box">
      <div style="font-size: 18px; line-height: 1;">✨</div>
      <div>
        <h5>Decant Resting & Storage Instructions</h5>
        <p>Due to transit temperature shifts, please allow your decants to rest for <strong>24 hours</strong> at room temperature in a dark place before first spray for true scent notes and maximum longevity.</p>
      </div>
    </div>

    <!-- Luxury Footer -->
    <div class="invoice-footer">
      <div class="authenticity-seal">✦ 100% Authentic Flacon Decant Guarantee ✦</div>
      <p>Thank you for choosing <strong>Decantre</strong> — Your Premier Destination for Luxury Perfumes.</p>
      <p style="margin-top: 4px; font-size: 11px; color: #64748B;">
        For questions or returns, reach out via WhatsApp at <strong>01869151550</strong> or email <a href="mailto:support@decantrebd.com">support@decantrebd.com</a>.
      </p>
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
