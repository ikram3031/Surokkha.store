import { config } from '../config/index.js';

/**
 * Builds HTML email body for notifying store owners/admins of a new customer order
 */
export const buildAdminOrderEmailHtml = ({
  order = {},
  brandName: customBrandName,
  adminDashboardUrl,
}) => {
  const brandName = customBrandName || config.brandName || '';
  const dashboardUrl = adminDashboardUrl || config.dashboardUrl || 'https://dashboard.example.com';
  const orderId = order.orderNumber || order.orderId || order.id || order._id || 'N/A';
  const customerName = order.customerName || order.billing?.name || 'Customer';
  const customerPhone = order.customerPhone || order.billing?.phone || 'N/A';
  const customerAddress = order.customerAddress || order.billing?.address || 'N/A';
  const totalAmount = Number(order.totalAmount || order.total || 0);
  const paymentMethod = order.paymentMethod || 'Cash on Delivery';
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsList = items.map((item) => {
    const name = item.productName || item.name || 'Product';
    const variant = item.variantName ? ` (${item.variantName})` : '';
    const qty = item.quantity || item.qty || 1;
    const price = Number(item.price || item.unitPrice || 0);
    return `<li style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
      <strong>${name}${variant}</strong> × ${qty} — ৳${(qty * price).toLocaleString()}
    </li>`;
  }).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; padding: 24px; color: #ffffff; text-align: center;">
        <h2 style="margin: 0 0 4px; font-size: 20px;">New Order Received!</h2>
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">Order #${orderId} on ${brandName}</p>
      </div>
      <div style="padding: 24px; color: #334155;">
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Phone:</strong> ${customerPhone}</p>
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Address:</strong> ${customerAddress}</p>
          <p style="margin: 0 0 6px; font-size: 14px;"><strong>Payment:</strong> ${paymentMethod}</p>
          <p style="margin: 0; font-size: 16px; color: #0f172a;"><strong>Total:</strong> ৳${totalAmount.toLocaleString()}</p>
        </div>
        <h4 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #64748b;">Ordered Items</h4>
        <ul style="list-style: none; padding: 0; margin: 0 0 24px;">
          ${itemsList || '<li style="font-size: 13px; color: #94a3b8;">No items listed</li>'}
        </ul>
        <div style="text-align: center;">
          <a href="${dashboardUrl}/dashboard/orders/${order._id || orderId}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View in Dashboard</a>
        </div>
      </div>
    </div>
  `;
};

export default { buildAdminOrderEmailHtml };
