import mongoose from 'mongoose';
import { validateOrderPayload } from '../../common/helper/orderHelper.js';
import { OrderModel } from '../../common/models/order.model.js';
import { ProductModel } from '../../common/models/product.model.js';
import { CouponModel } from '../../common/models/coupon.model.js';
import { PaymentModel } from '../../common/models/payment.model.js';
import {
  buildOrderDocument,
  resolveOrForceMembershipFromOrder,
  syncMemberOrderSnapshot,
  syncPaymentDocument,
} from '../../common/helper/orderControllerHelper.js';
import { getClientInvoiceHtml } from '../../common/templates/invoices/index.js';
import { config } from '../../common/config/index.js';
import { sendOrderEmailsAsynchronously } from '../../common/utils/orderDelivery.js';
import { sendServerPurchaseEvent } from '../../common/services/facebookCapi.service.js';
import { sendTikTokServerPurchaseEvent } from '../../common/services/tiktokEventsApi.service.js';

const { Types } = mongoose;

// Create a new order from checkout payload and sync related payment/member data
export const createOrder = async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const validationErrors = validateOrderPayload(payload);

    // Backend validation: Ensure single valid coupon
    const rawCoupon = payload.couponCode;
    if (rawCoupon && typeof rawCoupon === 'string' && rawCoupon.trim() !== '' && rawCoupon.trim().toLowerCase() !== 'null' && rawCoupon.trim().toLowerCase() !== 'undefined') {
      const code = rawCoupon.trim().toUpperCase();
      if (code.includes(',') || code.includes(' ') || code.includes(';')) {
        validationErrors.push('Only one coupon can be applied to an order');
      } else {
        const coupon = await CouponModel.findOne({ code });
        if (!coupon) {
          validationErrors.push('Coupon code is invalid or has expired');
        } else if (!coupon.active) {
          validationErrors.push('Coupon is currently inactive');
        } else {
          const now = new Date();
          if (coupon.validFrom && now < new Date(coupon.validFrom)) {
            validationErrors.push('Coupon promotion has not started yet');
          }
          if (coupon.validTo && now > new Date(coupon.validTo)) {
            validationErrors.push('Coupon code has expired');
          }
          const subtotal = Number(payload.subtotal || 0);
          if (subtotal < Number(coupon.minOrderAmount || 0)) {
            validationErrors.push(`Coupon requires a minimum purchase of ৳\${coupon.minOrderAmount}`);
          }
        }
      }
    }

    // Backend validation: Verify product exists and is in stock
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length > 0) {
      for (const item of items) {
        const productRef = item.productId || item.productDid || item.id || item._id;
        const productName = item.name || item.productName || 'Product';
        
        let productDoc = null;
        if (productRef) {
          if (mongoose.Types.ObjectId.isValid(productRef)) {
            productDoc = await ProductModel.findById(productRef).select('name stockStatus isActive').lean();
          }
          if (!productDoc) {
            productDoc = await ProductModel.findOne({ did: productRef }).select('name stockStatus isActive').lean();
          }
        }
        if (!productDoc && productName) {
          productDoc = await ProductModel.findOne({ name: productName }).select('name stockStatus isActive').lean();
        }

        if (productDoc) {
          if (productDoc.isActive === false) {
            validationErrors.push(`"\${productDoc.name || productName}" is currently unavailable.`);
          } else if (String(productDoc.stockStatus || '').toLowerCase().trim() === 'outofstock') {
            validationErrors.push(`"\${productDoc.name || productName}" is currently out of stock.`);
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: validationErrors.join(', '),
        errors: validationErrors,
      });
    }

    const orderData = await buildOrderDocument(payload);
    const createdOrder = await OrderModel.create(orderData);

    const resolvedMemberId = await resolveOrForceMembershipFromOrder(createdOrder, payload);

    await syncPaymentDocument(createdOrder, payload);
    await syncMemberOrderSnapshot(resolvedMemberId || orderData.member, createdOrder, payload);

    // Non-blocking email notifications for Customer and Admin
    sendOrderEmailsAsynchronously(createdOrder);

    const isInstoreOrder =
      payload.orderType === "instore" ||
      createdOrder.orderType === "instore" ||
      String(createdOrder.orderNumber || "").startsWith("IS") ||
      String(createdOrder.billingInfo?.email || "").includes("instore@");

    if (!isInstoreOrder) {
      sendServerPurchaseEvent(createdOrder, req);
      sendTikTokServerPurchaseEvent(createdOrder, req);
    }

    return res.status(201).json({
      status: 'success',
      data: createdOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Fetch a single order by ID or orderNumber for customer order status / tracking
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { did: orderId }, { orderNumber: orderId }] };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const order = await OrderModel.findOne(query).lean();
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const payment = await PaymentModel.findOne({ orderId: order._id }).lean();
    const fallbackPaid = ['completed', 'shipped'].includes(order.status);
    const effectivePaymentStatus = payment?.status || (fallbackPaid ? 'paid' : 'pending');

    const orderWithCustomer = {
      ...order,
      id: order._id.toString(),
      customer: order.billingInfo,
      paymentStatus: effectivePaymentStatus,
    };

    return res.json({ status: 'success', data: orderWithCustomer });
  } catch (error) {
    next(error);
  }
};

// Render printable HTML / PDF invoice view for customer order email link
export const getOrderInvoiceView = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const order = await OrderModel.findOne(query).lean();
    if (!order) {
      return res.status(404).send("<h1 style='font-family:sans-serif;text-align:center;padding:50px;'>Order Invoice Not Found</h1>");
    }

    const subtotal = Number(order.totals?.subtotal || order.subtotal || 0);
    const shippingFee = Number(order.totals?.shippingFee || order.shippingFee || order.shippingTotalAmount || 0);
    const discountAmount = Number(order.discountTotalAmount || order.totals?.discount || 0);
    const calculatedTotal = subtotal + shippingFee - discountAmount;
    const totalAmount = Number(order.totals?.total !== undefined ? order.totals.total : (order.totalAmount !== undefined ? order.totalAmount : calculatedTotal));
    const couponCode = order.couponCode ? String(order.couponCode).trim().toUpperCase() : null;

    const formattedOrderData = {
      orderId: order.orderNumber || order.did || order._id?.toString()?.slice(-6),
      status: order.status || 'processing',
      orderType: order.orderType || 'online',
      createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      customerName: order.billingInfo?.fullName || "Valued Customer",
      customerEmail: order.billingInfo?.email || "",
      customerPhone: order.billingInfo?.phone || "",
      billingAddress: order.billingInfo || {},
      shippingAddress: order.shippingInfo || order.billingInfo || {},
      items: Array.isArray(order.items) ? order.items.map(item => {
        const qty = Number(item.quantity || 1);
        const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
        const itemSubtotal = Number(item.subtotal ?? (unitPrice * qty) ?? 0);
        const variantParts = [item.size, item.concentration, item.variant, item.variantName].filter(Boolean);
        const variantName = [...new Set(variantParts)].join(' • ');

        return {
          productName: item.name || item.productName || "Product",
          variantName,
          size: item.size || "",
          concentration: item.concentration || "",
          quantity: qty,
          price: unitPrice,
          unitPrice,
          subtotal: itemSubtotal
        };
      }) : [],
      subtotal,
      shippingFee,
      discountAmount,
      couponCode,
      totalAmount,
      paymentMethod: order.paymentMethod || "Cash on Delivery",
    };

    const clientKey = order.client || config.clientKey || 'decantre';
    const invoiceHtml = getClientInvoiceHtml({
      order: formattedOrderData,
      isPrintView: true,
      client: clientKey,
      logoUrl: config.logoUrl || undefined,
    });
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-\${formattedOrderData.orderId}.pdf"`);
    return res.send(invoiceHtml);
  } catch (error) {
    next(error);
  }
};
