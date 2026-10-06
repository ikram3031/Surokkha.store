import mongoose from 'mongoose';
import { validateOrderPayload } from '../../common/helper/orderHelper.js';
import { OrderModel } from '../../common/models/order.model.js';
import { ProductModel } from '../../common/models/product.model.js';
import { CouponModel } from '../../common/models/coupon.model.js';
import { PaymentModel } from '../../common/models/payment.model.js';
import { FakeOrderModel } from '../../common/models/fakeOrder.model.js';
import { MemberModel } from '../../common/models/member.model.js';
import { StoreSettingsModel } from '../../common/models/storeSettings.model.js';
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
import { LogModel } from '../../common/models/log.model.js';
import { broadcastLiveNotification } from '../../common/websocket.js';

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
        let coupon = await CouponModel.findOne({ code });
        if (!coupon && code === 'FREEOCT') {
          coupon = {
            code: 'FREEOCT',
            discountType: 'free_shipping',
            discountValue: 0,
            minOrderAmount: 1000,
            active: true,
          };
        }
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
            validationErrors.push(`Coupon requires a minimum purchase of ৳${coupon.minOrderAmount}`);
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

    // Verification against fake orders database (Fake Order Prevention)
    const rawBillingPhone = String(payload.billingInfo?.phone || payload.phone || '').trim();
    const rawBillingEmail = String(payload.billingInfo?.email || payload.email || '').trim().toLowerCase();
    const cleanDigits = rawBillingPhone.replace(/\D/g, '');
    const corePhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    if (corePhone || rawBillingEmail) {
      const fakeQueryConditions = [];
      if (corePhone) {
        fakeQueryConditions.push({ 'customer.phone': { $regex: corePhone } });
      }
      if (rawBillingEmail && !rawBillingEmail.startsWith('instore@')) {
        fakeQueryConditions.push({ 'customer.email': rawBillingEmail });
      }

      const matchingFake = await FakeOrderModel.findOne({ $or: fakeQueryConditions }).lean();
      if (matchingFake) {
        // Exemption check: If existing customer already has genuine completed orders, permit order
        let isTrustedCustomer = false;
        if (corePhone) {
          const verifiedMember = await MemberModel.findOne({
            $or: [{ phone: { $regex: corePhone } }, { phones: { $elemMatch: { $regex: corePhone } } }],
            isActive: true,
          }).lean();
          if (verifiedMember && (verifiedMember.totalOrderAmount > 0 || verifiedMember.orders?.length > 1)) {
            isTrustedCustomer = true;
          }
        }

        if (!isTrustedCustomer) {
          return res.status(400).json({
            status: 'error',
            message: 'অনুগ্রহ করে অন্য একটি বৈধ ফোন নম্বর ব্যবহার করুন। (Please use a different valid phone number)',
            errors: ['Please provide a different valid phone number.'],
          });
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

    const orderData = await buildOrderDocument(payload, req);
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

    const isCustomOrder =
      payload.orderType === "custom" ||
      createdOrder.orderType === "custom" ||
      String(createdOrder.orderNumber || "").startsWith("CO");

    if (!isInstoreOrder && !isCustomOrder) {
      sendServerPurchaseEvent(createdOrder, req);
      sendTikTokServerPurchaseEvent(createdOrder, req);
    }

    // Automatically record newOrder activity log and broadcast live notification
    try {
      const customerName =
        createdOrder.shippingInfo?.fullName ||
        createdOrder.billingInfo?.fullName ||
        "Customer";
      const actorDid = "customer";
      const orderTypeLabel = isCustomOrder ? "custom order" : isInstoreOrder ? "in-store order" : "order";
      const log = await LogModel.create({
        type: "newOrder",
        typeDid: "111",
        description: `${customerName} placed a new ${orderTypeLabel} #${createdOrder.orderNumber}`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });

      broadcastLiveNotification(log).catch((err) => {
        console.error("Non-blocking WS live notification error on storefront order:", err);
      });
    } catch (logErr) {
      console.error("Non-blocking storefront order log creation error:", logErr);
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
    const effectivePaymentStatus = payment?.status || order.paymentStatus || (fallbackPaid ? 'paid' : 'pending');
    const effectivePaid = payment?.paidAmount ?? order.paidAmount ?? (effectivePaymentStatus === 'paid' ? (order.totals?.total ?? 0) : 0);

    const orderWithCustomer = {
      ...order,
      id: order._id.toString(),
      customer: order.billingInfo,
      paymentStatus: effectivePaymentStatus,
      paidAmount: effectivePaid,
      paymentPhone: payment?.paymentPhone ?? order.paymentPhone ?? '',
      paymentDetails: payment || null,
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

    const clientKey = order.client || config.clientKey || 'surokkha';

    let templateConfig = null;
    try {
      const storeSettings = await StoreSettingsModel.findOne({ key: "default" }).lean();
      if (storeSettings?.templates?.isActive) {
        templateConfig = storeSettings.templates;
      }
    } catch (_) {}

    const invoiceHtml = getClientInvoiceHtml({
      order: formattedOrderData,
      isPrintView: true,
      client: clientKey,
      logoUrl: config.logoUrl || undefined,
      templateConfig,
    });
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${formattedOrderData.orderId}.pdf"`);
    return res.send(invoiceHtml);
  } catch (error) {
    next(error);
  }
};

// Check if a phone number or email is flagged in fake_orders
export const checkPhoneStatus = async (req, res, next) => {
  try {
    const rawPhone = String(req.query.phone || req.body?.phone || '').trim();
    const rawEmail = String(req.query.email || req.body?.email || '').trim().toLowerCase();

    const cleanDigits = rawPhone.replace(/\D/g, '');
    const corePhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    if (!corePhone && !rawEmail) {
      return res.json({ status: 'success', isFake: false });
    }

    const fakeQueryConditions = [];
    if (corePhone) {
      fakeQueryConditions.push({ 'customer.phone': { $regex: corePhone } });
    }
    if (rawEmail && !rawEmail.startsWith('instore@')) {
      fakeQueryConditions.push({ 'customer.email': rawEmail });
    }

    const fakeRecord = await FakeOrderModel.findOne({ $or: fakeQueryConditions }).lean();
    if (!fakeRecord) {
      return res.json({ status: 'success', isFake: false });
    }

    // Exemption check for trusted existing customer
    if (corePhone) {
      const verifiedMember = await MemberModel.findOne({
        $or: [{ phone: { $regex: corePhone } }, { phones: { $elemMatch: { $regex: corePhone } } }],
        isActive: true,
      }).lean();
      if (verifiedMember && (verifiedMember.totalOrderAmount > 0 || verifiedMember.orders?.length > 1)) {
        return res.json({ status: 'success', isFake: false, isTrustedCustomer: true });
      }
    }

    return res.json({
      status: 'success',
      isFake: true,
      message: 'অনুগ্রহ করে অন্য একটি ফোন নম্বর ব্যবহার করুন। (Please use a different phone number)',
    });
  } catch (error) {
    next(error);
  }
};
