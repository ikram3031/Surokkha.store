import { config } from "../config/index.js";
import { PaymentModel } from "../models/payment.model.js";
import { getSmtpTransport } from "../services/smtpConfig.service.js";
import { buildOrderStatusEmail, STATUS_EMAILS } from "../templates/orderStatusEmailTemplate.js";

const isRealEmail = (email) => {
  const e = String(email || "").trim().toLowerCase();
  if (!e || e.includes("instore@") || e.includes("noemail") || e.includes("dummy") || e.endsWith("@store.com")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

const isInstore = (order) =>
  order.orderType === "instore" ||
  String(order.orderNumber || "").startsWith("IS") ||
  String(order.paymentMethod || "").toLowerCase() === "instore";

const formatOrder = async (order) => {
  const t = order.totals || {};
  const subtotal = Number(t.subtotal ?? order.subtotal ?? 0);
  const shippingFee = Number(t.shippingFee ?? order.shippingFee ?? order.shippingTotalAmount ?? 0);
  const discountAmount = Number(order.discountTotalAmount ?? t.discount ?? 0);
  const totalAmount = Number(t.total ?? order.totalAmount ?? subtotal + shippingFee - discountAmount);
  const payment = await PaymentModel.findOne({ orderId: order._id }).lean().catch(() => null);
  const paymentStatus = payment?.status || order.paymentStatus || "pending";
  const paidAmount = Number(payment?.paidAmount ?? order.paidAmount ?? (paymentStatus === "paid" ? totalAmount : 0));
  const courier = order.courier || {};

  return {
    orderId: order.orderNumber || order.did || String(order._id || "").slice(-6),
    clientDomain: order.clientDomain,
    createdAt: order.createdAt,
    customerName: order.billingInfo?.fullName || "Valued Customer",
    customerPhone: order.billingInfo?.phone || "",
    billingAddress: order.billingInfo || {},
    shippingAddress: order.shippingInfo || null,
    items: (order.items || []).map((i) => {
      const qty = Number(i.quantity || 1);
      const price = Number(i.unitPrice ?? i.price ?? 0);
      return {
        productName: i.name || i.productName || "Product",
        variantName: [...new Set([i.size, i.concentration, i.variant, i.variantName].filter(Boolean))].join(" • "),
        quantity: qty,
        price,
        subtotal: Number(i.subtotal ?? price * qty),
      };
    }),
    subtotal,
    shippingFee,
    discountAmount,
    couponCode: order.couponCode ? String(order.couponCode).trim().toUpperCase() : null,
    totalAmount,
    paymentMethod: order.paymentMethod || "Cash on Delivery",
    paymentStatus,
    paidAmount,
    courier: {
      provider: courier.provider,
      consignmentId: courier.consignmentId,
      trackingCode: courier.trackingCode,
      dispatchedAt: courier.dispatchedAt,
    },
  };
};

/**
 * Emails the customer when their order moves to a new status (processing, hold, shipped,
 * completed, cancelled, return). Runs in the background; never throws into the caller.
 */
export const notifyOrderStatusChange = (order, previousStatus) => {
  const raw = order?.toObject ? order.toObject() : order;
  if (!raw) return;
  const status = String(raw.status || "").toLowerCase() === "canceled" ? "cancelled" : String(raw.status || "").toLowerCase();
  if (!STATUS_EMAILS[status] || status === String(previousStatus || "").toLowerCase()) return;
  if (isInstore(raw)) return;
  const to = raw.billingInfo?.email || raw.shippingInfo?.email || "";
  if (!isRealEmail(to)) return;

  setImmediate(async () => {
    try {
      const { transport, config: smtp } = await getSmtpTransport();
      if (!smtp.isConfigured || !transport) return;
      const email = buildOrderStatusEmail({ status, order: await formatOrder(raw) });
      if (!email) return;
      const brand = smtp.fromName || config.brandName || "Surokkha";
      const fromEmail = smtp.fromEmail || smtp.user || `no-reply@${config.domain || "surokkha.store"}`;
      await transport.sendMail({
        from: { name: brand, address: fromEmail },
        to,
        replyTo: { name: brand, address: fromEmail },
        subject: email.subject,
        html: email.html,
      });
      console.log(`[Status Email] ${status} email sent for #${raw.orderNumber} to ${to}`);
    } catch (err) {
      console.error(`[Status Email] Failed for #${raw?.orderNumber}:`, err.message);
    }
  });
};
