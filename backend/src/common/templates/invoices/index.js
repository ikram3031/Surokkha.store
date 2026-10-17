import { config } from '../../config/index.js';
import { compileA4InvoiceHtml } from './templateEngine.js';

/**
 * Generates dynamic, responsive HTML invoice for storefront and dashboard views
 */
export const getClientInvoiceHtml = ({
  order = {},
  isPrintView = false,
  client = 'demo',
  logoUrl,
  brandName: customBrandName,
  address: customAddress,
  phone: customPhone,
  email: customEmail,
  templateConfig,
}) => {
  // If templateConfig is provided, compile via dynamic template engine
  if (templateConfig) {
    try {
      return compileA4InvoiceHtml({
        templateConfig,
        order,
        clientConfig: config,
        isPrintView,
      });
    } catch (err) {
      console.warn('Dynamic template compilation fallback to default:', err.message);
    }
  }

  const brandName = customBrandName || config.brandName || '';
  const displayLogo = logoUrl || config.logoUrl || '';
  const storeAddress = customAddress || config.contact?.address || config.address || '';
  const storePhone = customPhone || config.contact?.phone || config.phone || config.supportPhone || '';
  const storeEmail = customEmail || config.contact?.supportEmail || config.supportEmail || '';

  const orderId = order.orderId || order.orderNumber || order.id || order._id || 'INV-0000';
  const orderDate = order.orderDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString());
  const customerName = order.customerName || order.billing?.name || order.shipping?.name || 'Valued Customer';
  const customerPhone = order.customerPhone || order.billing?.phone || order.shipping?.phone || '';
  const customerAddress = order.customerAddress || order.billing?.address || order.shipping?.address || '';
  const customerEmail = order.customerEmail || order.billing?.email || order.shipping?.email || '';

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || order.subtotalAmount || 0);
  const shippingFee = Number(order.shippingFee || order.deliveryCharge || 0);
  const discountAmount = Number(order.discountAmount || order.discount || 0);
  const totalAmount = Number(order.totalAmount || order.total || (subtotal + shippingFee - discountAmount));
  const paymentMethod = order.paymentMethod || 'Cash on Delivery';
  const paymentStatus = order.paymentStatus || 'unpaid';

  const itemsRows = items.map((item, idx) => {
    const name = item.productName || item.name || item.title || 'Product';
    const variant = item.variantName ? ` (${item.variantName})` : (item.size ? ` - ${item.size}` : '');
    const qty = Number(item.quantity || item.qty || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const itemTotal = Number(item.subtotal || item.total || (qty * unitPrice));

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 16px; font-size: 13px; color: #1e293b; font-weight: 500;">
          ${name}${variant}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #475569; text-align: center;">
          ${qty}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #475569; text-align: right;">
          ৳${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #1e293b; font-weight: 600; text-align: right;">
          ৳${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${orderId} - ${brandName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; padding: 24px; color: #334155; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .invoice-header { padding: 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .brand-title { font-size: 24px; font-weight: 800; color: #0f172a; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .invoice-meta p { font-size: 12px; color: #64748b; }
    .invoice-body { padding: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; font-weight: 700; }
    .info-block p { font-size: 13px; color: #334155; line-height: 1.6; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { background: #f1f5f9; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; font-weight: 700; text-align: left; }
    .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .totals-row.grand-total { border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 800; color: #0f172a; }
    .invoice-footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .print-btn { display: inline-block; padding: 10px 20px; background: #0f172a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; margin-bottom: 16px; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div style="text-align: center;" class="no-print">
    <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="invoice-header">
      <div>
        ${displayLogo ? `<img src="${displayLogo}" alt="${brandName}" style="max-height: 44px; width: auto; margin-bottom: 8px;" />` : `<div class="brand-title">${brandName}</div>`}
        <p style="font-size: 12px; color: #64748b;">${storeAddress}</p>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p><strong>Order #:</strong> ${orderId}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
        <p><strong>Payment:</strong> ${paymentMethod} (${paymentStatus.toUpperCase()})</p>
      </div>
    </div>
    <div class="invoice-body">
      <div class="info-grid">
        <div class="info-block">
          <h3>Billed To</h3>
          <p><strong>${customerName}</strong></p>
          ${customerPhone ? `<p>Phone: ${customerPhone}</p>` : ''}
          ${customerAddress ? `<p>Address: ${customerAddress}</p>` : ''}
          ${customerEmail ? `<p>Email: ${customerEmail}</p>` : ''}
        </div>
        <div class="info-block" style="text-align: right;">
          <h3>Sold By</h3>
          <p><strong>${brandName}</strong></p>
          <p>${storeAddress}</p>
          <p>Phone: ${storePhone}</p>
          <p>Support: ${storeEmail}</p>
        </div>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">No items</td></tr>'}
        </tbody>
      </table>
      <div class="totals-wrapper">
        <div class="totals-table">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>৳${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="totals-row">
            <span>Shipping</span>
            <span>৳${shippingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          ${discountAmount > 0 ? `
          <div class="totals-row" style="color: #16a34a;">
            <span>Discount</span>
            <span>-৳${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>` : ''}
          <div class="totals-row grand-total">
            <span>Grand Total</span>
            <span>৳${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="invoice-footer">
      <p>Thank you for shopping with <strong>${brandName}</strong>! For any questions, contact us at <strong>${storeEmail}</strong> or <strong>${storePhone}</strong>.</p>
    </div>
  </div>
</body>
</html>`;
};

export default { getClientInvoiceHtml };
