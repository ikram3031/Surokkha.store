/**
 * Surokkha Personal Wellness Store — Customer Order Confirmation Email Template
 * Optimized for full HTML email client rendering (Gmail, Outlook, Apple Mail, Yahoo)
 * 
 * Features:
 * - Clean light background (#F8FAFC / #FFFFFF) with Surokkha brand rose/burgundy accents (#881337 / #BE123C)
 * - Table-based bulletproof email layout with inline styles
 * - 100% Discreet packaging assurance guarantee
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {string} [params.logoUrl] - Public Surokkha Logo URL
 * @returns {string} Standalone HTML email string
 */
export const buildSurokkhaOrderInvoiceEmailHtml = ({
  order = {},
  logoUrl = "https://admin.surokkha.store/logo.png",
}) => {
  const {
    orderId = "N/A",
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

  // Formats address safely
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

  // Build item rows
  const itemRowsHtml = items.map((item, index) => {
    const isEven = index % 2 === 1;
    const itemName = item.productName || item.name || "MO Wellness Product";
    const variantParts = [item.size, item.variant, item.variantName, item.packType].filter(Boolean);
    const variant = [...new Set(variantParts)].join(" • ") || item.variantName || item.size || "Standard Pack";
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const itemTotal = Number(item.subtotal || (unitPrice * qty) || 0);

    return `
      <tr style="background-color: ${isEven ? "#FFF5F7" : "#FFFFFF"}; border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #0F172A; vertical-align: top;">
          <strong style="color: #0F172A; font-weight: 700; font-size: 13.5px;">${itemName}</strong>
          ${variant ? `<div style="font-size: 11px; color: #9F1239; font-weight: 600; margin-top: 2px;">✦ ${variant}</div>` : ""}
        </td>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #334155; text-align: center; vertical-align: top;">
          ${qty}
        </td>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #334155; text-align: right; vertical-align: top; white-space: nowrap;">
          ৳${unitPrice.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #881337; font-weight: 700; text-align: right; vertical-align: top; white-space: nowrap;">
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
  <title>Order Confirmation #${orderId}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #881337 0%, #BE123C 50%, #FDA4AF 100%);"></td>
          </tr>

          <!-- Centered Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 20px 24px; border-bottom: 1px solid #F1F5F9; text-align: center;">
              <img src="${logoUrl}" alt="Surokkha Logo" style="max-height: 52px; height: 52px; width: auto; object-fit: contain; display: block; margin: 0 auto 14px auto;" />
              <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0F172A; margin-bottom: 8px;">INVOICE <span style="color: #BE123C;">#${orderId}</span></div>
              <div>
                <span style="display: inline-block; padding: 5px 16px; background-color: #FFF1F2; color: #9F1239; border: 1px solid #FECDD3; border-radius: 9999px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.75px;">✓ ORDER CONFIRMED</span>
              </div>
            </td>
          </tr>

          <!-- Customer & Order Meta Information -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAFA; border-bottom: 1px solid #F1F5F9;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 6px;">Customer & Delivery Details</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #1E293B;">${customerName}</div>
                    <div style="font-size: 13px; color: #64748B; margin-top: 2px;">${customerPhone}</div>
                    ${customerEmail ? `<div style="font-size: 12px; color: #64748B; margin-top: 1px;">${customerEmail}</div>` : ""}
                    <div style="margin-top: 8px; font-size: 12.5px; color: #1E293B; line-height: 1.4;">
                      <strong style="color: #475569; font-size: 11px; text-transform: uppercase;">Shipping Coordinates:</strong><br />
                      ${deliveryAddressStr}
                    </div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 6px;">Order & Payment Info</div>
                    <div style="font-size: 13px; color: #1E293B; line-height: 1.5;">
                      <strong>Order Date:</strong> ${createdAt}<br />
                      <strong>Payment Method:</strong> ${paymentMethod}<br />
                      <strong>Payment Status:</strong> <span style="color: #15803D; font-weight: 700;">Pending (COD)</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 12.5px; color: #1E293B; line-height: 1.4;">
                      <strong style="color: #475569; font-size: 11px; text-transform: uppercase;">Customer Helpline:</strong><br />
                      <a href="https://wa.me/8801600905774" target="_blank" style="color: #BE123C; text-decoration: none; font-weight: 700;">01600905774</a> (WhatsApp)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FFFFFF;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #881337; color: #FFFFFF;">
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: left; border-top-left-radius: 8px;">Product & Pack Details</th>
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: right; width: 90px;">Unit Price</th>
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: right; width: 90px; border-top-right-radius: 8px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-top: 2px solid #881337; padding-top: 14px;">
                <tr>
                  <td></td>
                  <td width="260">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #475569;">Items Subtotal:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1E293B; font-weight: 600; text-align: right;">৳${Number(subtotal).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #475569;">Delivery Fee:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1E293B; font-weight: 600; text-align: right;">${Number(shippingFee) > 0 ? `৳${Number(shippingFee).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '<span style="color: #15803D; font-weight: 600;">Free</span>'}</td>
                      </tr>
                      ${Number(discountAmount) > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #15803D; font-weight: 600;">Discount ${couponCode ? `(${couponCode})` : ""}:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #15803D; font-weight: 700; text-align: right;">-৳${Number(discountAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 15px; font-weight: 700; color: #0F172A;">Grand Total (BDT):</td>
                        <td style="padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 18px; font-weight: 800; color: #881337; text-align: right;">৳${Number(totalAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Thank you message above footer -->
          <tr>
            <td style="padding: 16px 32px; background-color: #FFFFFF; text-align: center; font-size: 12.5px; color: #334155; border-top: 1px solid #F1F5F9;">
              Thank you for choosing <a href="https://surokkha.store" target="_blank" style="color: #BE123C; text-decoration: none; font-weight: 700;"><strong>Surokkha.store</strong></a> — Trusted Destination for Personal Wellness
            </td>
          </tr>

          <!-- Clean Light Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; color: #475569; text-align: center; font-size: 11.5px; line-height: 1.6;">
              <div>
                Helpline (WhatsApp): <a href="https://wa.me/8801600905774" target="_blank" style="color: #BE123C; text-decoration: underline; font-weight: 700;">01600905774</a> | Email: <a href="mailto:support@surokkha.store" style="color: #BE123C; text-decoration: none; font-weight: 600;">support@surokkha.store</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
