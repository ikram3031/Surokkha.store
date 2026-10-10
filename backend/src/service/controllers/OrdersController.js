import mongoose from 'mongoose';
import { validateOrderPayload } from '../../common/helper/orderHelper.js';
import { OrderModel } from '../../common/models/order.model.js';
import { ProductModel } from '../../common/models/product.model.js';
import { MemberModel } from '../../common/models/member.model.js';
import { CouponModel } from '../../common/models/coupon.model.js';
import { PaymentModel } from '../../common/models/payment.model.js';
import { StoreSettingsModel } from '../../common/models/storeSettings.model.js';
import { BillingModel } from '../../common/models/billing.model.js';
import { BillTypeModel } from '../../common/models/billType.model.js';
import { buildAllowedOrderUpdates,
  buildOrderDocument,
  resolveOrForceMembershipFromOrder,
  syncMemberOrderSnapshot,
  syncPaymentDocument,
  updateMemberOrderReference,
  updateMemberTotals,
} from '../../common/helper/orderControllerHelper.js';
import { getClientInvoiceHtml } from '../../common/templates/invoices/index.js';
import { LogModel } from '../../common/models/log.model.js';
import { SpamListModel } from '../../common/models/spamList.model.js';
import { broadcastLiveNotification } from "../../common/websocket.js";
import { config } from '../../common/config/index.js';

const { Types } = mongoose;

import { sendOrderEmailsAsynchronously } from '../../common/utils/orderDelivery.js';
import { sendServerPurchaseEvent } from '../../common/services/facebookCapi.service.js';
import { getSmtpTransport } from '../../common/services/smtpConfig.service.js';
import { compileTransactionalEmailHtml } from '../../common/templates/invoices/templateEngine.js';
import { sendTikTokServerPurchaseEvent } from '../../common/services/tiktokEventsApi.service.js';

// Create a new order from checkout payload and sync related payment/member data.
export const createOrder = async (req, res, next) => {
  try {
    const payload = req.body ?? {};

    const clientEmail = payload.billingInfo?.email || payload.email || payload.customerInfo?.email || null;
    const clientPhone = payload.billingInfo?.phone || payload.phone || payload.customerInfo?.phone || null;

    if (clientEmail || clientPhone) {
      const spamQuery = { $or: [] };
      if (clientEmail) spamQuery.$or.push({ email: clientEmail.toLowerCase() });
      if (clientPhone) spamQuery.$or.push({ phone: clientPhone });

      const isSpammer = await SpamListModel.findOne(spamQuery).lean();
      if (isSpammer) {
        return res.status(403).json({ success: false, message: 'Order can not be created, Please contact our support' });
      }
    }

    const validationErrors = validateOrderPayload(payload);

    // Backend validation: Ensure multiple coupons are not added at once (optional field)
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
            validationErrors.push(`"${productDoc.name || productName}" is currently unavailable.`);
          } else if (String(productDoc.stockStatus || '').toLowerCase().trim() === 'outofstock') {
            validationErrors.push(`"${productDoc.name || productName}" is currently out of stock.`);
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

    // Safely trigger non-blocking email notifications for Customer and Admin
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
      // Safely dispatch server-side Meta Conversions API (CAPI) Purchase event for online customer storefront orders only
      sendServerPurchaseEvent(createdOrder, req);

      // Safely dispatch server-side TikTok Events API CompletePayment event for online customer storefront orders only
      sendTikTokServerPurchaseEvent(createdOrder, req);
    }

    // Automatically record newOrder activity log
    try {
      const customerName =
        createdOrder.billingInfo?.fullName ||
        createdOrder.shippingInfo?.fullName ||
        "Customer";
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      let descriptionStr = `${customerName} placed a new order #${createdOrder.orderNumber}`;
      
      if (isCustomOrder) {
        descriptionStr = `${actorName} added a new custom order #${createdOrder.orderNumber}`;
      } else if (isInstoreOrder) {
        descriptionStr = `${actorName} added a new in-store order #${createdOrder.orderNumber}`;
      }

      const log = await LogModel.create({
        type: "newOrder",
        typeDid: "111",
        description: descriptionStr,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });

      broadcastLiveNotification(log).catch((err) => {
        console.error("Non-blocking WS live notification error on order:", err);
      });
    } catch (logErr) {
      console.error("Non-blocking order log creation error:", logErr);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Order received successfully',
      data: createdOrder,
    });
  } catch (error) {
    next(error);
  }
};

// List orders with pagination and optional filtering by status, paymentStatus, or customer email.
export const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const andConditions = [];

    if (req.query.active !== undefined) {
      andConditions.push({ active: req.query.active === 'false' || req.query.active === false ? false : true });
    } else {
      andConditions.push({ active: true });
    }

    if (req.query.status) {
      andConditions.push({ status: req.query.status.toLowerCase() });
    }

    if (req.query.orderType === 'custom') {
      andConditions.push({
        $or: [
          { orderType: 'custom' },
          { orderNumber: { $regex: '^CO', $options: 'i' } }
        ]
      });
    } else if (req.query.orderType === 'instore') {
      andConditions.push({
        $or: [
          { orderType: 'instore' },
          { orderNumber: { $regex: '^IS', $options: 'i' } }
        ]
      });
    } else if (req.query.orderType === 'online') {
      andConditions.push({
        $and: [
          { orderType: { $nin: ['instore', 'custom'] } },
          { orderNumber: { $not: { $regex: '^(IS|CO)', $options: 'i' } } }
        ]
      });
    }

    if (req.query.paymentStatus) {
      const pStatus = req.query.paymentStatus.toLowerCase();
      const matchingPayments = await PaymentModel.find({ status: pStatus }).distinct('orderId');
      if (pStatus === 'paid') {
        andConditions.push({
          $or: [
            { _id: { $in: matchingPayments } },
            { status: { $in: ['completed', 'shipped'] } }
          ]
        });
      } else if (pStatus === 'pending') {
        const paidPayments = await PaymentModel.find({ status: 'paid' }).distinct('orderId');
        andConditions.push({
          $and: [
            { _id: { $nin: paidPayments } },
            { status: { $nin: ['completed', 'shipped'] } }
          ]
        });
      } else {
        andConditions.push({ _id: { $in: matchingPayments } });
      }
    }

    if (req.query.search) {
      const term = String(req.query.search).trim();
      if (term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const textRegex = new RegExp(escaped, 'i');
        const searchOr = [
          { orderNumber: textRegex },
          { did: textRegex },
          { 'billingInfo.fullName': textRegex },
          { 'shippingInfo.fullName': textRegex },
          { 'billingInfo.email': textRegex },
          { 'shippingInfo.email': textRegex },
          { 'billingInfo.phone': textRegex },
          { 'shippingInfo.phone': textRegex },
        ];

        const digitsOnly = term.replace(/\D/g, '');
        if (digitsOnly.length >= 3) {
          const rawDigitsRegex = new RegExp(digitsOnly, 'i');
          searchOr.push({ 'billingInfo.phone': rawDigitsRegex });
          searchOr.push({ 'shippingInfo.phone': rawDigitsRegex });

          const coreDigits = digitsOnly.startsWith('880')
            ? digitsOnly.slice(3)
            : digitsOnly.startsWith('0')
            ? digitsOnly.slice(1)
            : digitsOnly;

          if (coreDigits.length >= 3 && coreDigits !== digitsOnly) {
            const coreRegex = new RegExp(coreDigits, 'i');
            searchOr.push({ 'billingInfo.phone': coreRegex });
            searchOr.push({ 'shippingInfo.phone': coreRegex });
          }
        }

        if (Types.ObjectId.isValid(term)) {
          searchOr.push({ _id: new Types.ObjectId(term) });
        }

        andConditions.push({ $or: searchOr });
      }
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const total = await OrderModel.countDocuments(filter);
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const orderIds = orders.map((o) => o._id);
    const payments = await PaymentModel.find({ orderId: { $in: orderIds } }).select('orderId status').lean();
    const paymentMap = new Map(payments.map((p) => [p.orderId.toString(), p.status]));

        const data = orders.map((order) => {
      const pStatus = paymentMap.get(order._id.toString());
      const fallbackPaid = ['completed', 'shipped'].includes(order.status);
      const effectivePaymentStatus = pStatus || (fallbackPaid ? 'paid' : 'pending');
      return {
        ...order,
        id: order._id.toString(),
        customer: order.billingInfo,
        paymentStatus: effectivePaymentStatus,
      };
    });

    return res.json({
      status: 'success',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Fetch a single order by Mongo ObjectId for detail views or admin editing.
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID' });
    }

        const order = await OrderModel.findById(orderId).lean();
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

// Update an existing order while keeping member references and payment sync consistent.
export const updateOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const payload = req.body ?? {};
    const existingOrder = await OrderModel.findOne(query).lean();
    if (!existingOrder) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const affectedMemberIds = new Set();
    if (existingOrder.member) {
      affectedMemberIds.add(existingOrder.member.toString());
    }

    const allowedUpdates = await buildAllowedOrderUpdates(payload, existingOrder);

    // Fallback updatedBy to authenticated user ID if not explicitly resolved from payload
    if (!allowedUpdates.updatedBy && req.user?.userId) {
      allowedUpdates.updatedBy = req.user.userId;
    }

    if (payload.memberId !== undefined && payload.memberId && Types.ObjectId.isValid(payload.memberId)) {
      affectedMemberIds.add(payload.memberId);
    }

    const order = await OrderModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (order.orderType === 'fake') {
      try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const phone = order.billingInfo?.phone || order.shippingInfo?.phone || "";
        const email = order.billingInfo?.email || order.shippingInfo?.email || "";
        if (ip || phone || email) {
          await SpamListModel.create({ ip, phone, email });
        }
      } catch (err) {
        console.error("Error adding fake order to spam list:", err);
      }
    }

    if (allowedUpdates.status === 'return') {
      try {
        await PaymentModel.updateMany({ orderId: order._id }, { $set: { isActive: false, status: 'cancelled' } });
        const returnFeeNum = Number(payload.returnFee);
        if (returnFeeNum > 0) {
          let billType = await BillTypeModel.findOne({ name: 'Return' });
          if (!billType) {
            billType = await BillTypeModel.create({ name: 'Return', active: true });
          }
          await BillingModel.create({
            orderId: order._id,
            billTypeId: billType._id,
            title: `${order.did || order.orderNumber || order._id} return`,
            totalAmount: returnFeeNum,
            amount: returnFeeNum,
            pendingAmount: returnFeeNum,
            status: 'active',
            notes: `${order.shippingInfo?.fullName || order.billingInfo?.fullName || 'Customer'} returned ${order.items?.map(i => i.name).join(', ') || 'products'}`
          });
        }
      } catch (returnErr) {
        console.error("Error handling return billing:", returnErr);
      }
    }

    const oldMemberId = existingOrder.member ? existingOrder.member.toString() : null;
    const newMemberId = order.member ? order.member.toString() : null;
    const orderDid = order.did;
    const orderValue = Number(order.totals?.total || 0);

    if (oldMemberId && oldMemberId !== newMemberId) {
      await MemberModel.updateOne(
        { _id: oldMemberId },
        { $pull: { orders: { did: orderDid } } },
      );
    }

    if (newMemberId) {
      await updateMemberOrderReference(newMemberId, orderDid, orderValue);
    }

        await syncPaymentDocument(order, payload);

    if (oldMemberId) affectedMemberIds.add(oldMemberId);
    if (newMemberId) affectedMemberIds.add(newMemberId);

    for (const memberId of affectedMemberIds) {
      await updateMemberTotals(memberId);
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

    return res.status(200).json({ status: 'success', data: orderWithCustomer });
  } catch (error) {
    next(error);
  }
};

// Soft delete an order by setting active = false and clean up its linked member and payment records.
export const deleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Try finding by _id (if valid ObjectId) or by custom id/did
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const deletedOrder = await OrderModel.findOneAndUpdate(query, { $set: { active: false } }, { new: true }).lean();
    if (!deletedOrder) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Safe cleanup of member reference
    if (deletedOrder.member) {
      try {
        if (deletedOrder.did) {
          await MemberModel.updateOne(
            { _id: deletedOrder.member },
            { $pull: { orders: { did: deletedOrder.did } } }
          );
        }
        await updateMemberTotals(deletedOrder.member);
      } catch (memErr) {
        console.error("Error updating member totals on order delete:", memErr);
      }
    }

    // Safe cleanup of payment record
    try {
      await PaymentModel.findOneAndDelete({ orderId: deletedOrder._id });
    } catch (payErr) {
      console.error("Error deleting linked payment record:", payErr);
    }

    return res.json({ status: 'success', message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Soft delete multiple orders by setting active = false in bulk.
export const bulkDeleteOrders = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order IDs provided' });
    }

    // Convert IDs to Mongoose ObjectIds where applicable
    const objectIds = ids.map(id => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null).filter(Boolean);

    // Build query targeting ObjectIds, custom short IDs (did), or order numbers
    const deleteQuery = {
      $or: [
        { _id: { $in: objectIds } },
        { did: { $in: ids } },
        { orderNumber: { $in: ids } }
      ]
    };

    // Find orders to identify linked members and payments before deletion
    const orders = await OrderModel.find(deleteQuery).lean();
    if (orders.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No orders found to delete' });
    }

    // Perform soft delete of order documents (active = false)
    await OrderModel.updateMany(deleteQuery, { $set: { active: false } });

    // Collect distinct member IDs, dids, and database ObjectIds
    const memberIds = [...new Set(orders.map(o => o.member).filter(Boolean))];

    let returnBillType = null;
    const returnFeeNum = Number(req.body.returnFee);
    if (updateFields.status === 'return' && returnFeeNum > 0) {
      returnBillType = await BillTypeModel.findOne({ name: 'Return' });
      if (!returnBillType) {
        returnBillType = await BillTypeModel.create({ name: 'Return', active: true });
      }
    }

    // Loop through each order to update payments
    for (const order of orders) {
      const updatedOrder = await OrderModel.findById(order._id).lean();
      if (!updatedOrder) continue;

      if (updateFields.status === 'return') {
        try {
          await PaymentModel.updateMany({ orderId: updatedOrder._id }, { $set: { isActive: false, status: 'cancelled' } });
          
          if (returnFeeNum > 0 && returnBillType) {
            await BillingModel.create({
              orderId: updatedOrder._id,
              billTypeId: returnBillType._id,
              title: `${updatedOrder.did || updatedOrder.orderNumber || updatedOrder._id} return`,
              totalAmount: returnFeeNum,
              amount: returnFeeNum,
              pendingAmount: returnFeeNum,
              status: 'active',
              notes: `${updatedOrder.shippingInfo?.fullName || updatedOrder.billingInfo?.fullName || 'Customer'} returned ${updatedOrder.items?.map(i => i.name).join(', ') || 'products'}`
            });
          }
        } catch (returnErr) {
          console.error("Error handling return billing in bulk:", returnErr);
        }
      } else if (paymentStatus) {
        const pStatus = paymentStatus.toLowerCase();
        const rawTotal = Number(updatedOrder.totals?.total || 0);
        const shippingFee = Number(updatedOrder.totals?.shippingFee ?? updatedOrder.shippingTotalAmount ?? 0);
        const totalAmount = Math.max(0, rawTotal - shippingFee);
        const paidAmount = pStatus === 'paid' ? totalAmount : 0;
        const pendingAmount = Math.max(0, totalAmount - paidAmount);

        await PaymentModel.findOneAndUpdate(
          { orderId: updatedOrder._id },
          {
            paymentMethod: updatedOrder.paymentMethod,
            paymentPhone: updatedOrder.billingInfo?.phone || '',
            totalAmount,
            paidAmount,
            pendingAmount,
            amount: paidAmount,
            status: pStatus,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        // Fall back to standard payment sync based on order state
        await syncPaymentDocument(updatedOrder);
      }
    }

    // Recalculate member totals
    if (memberIds.length > 0) {
      for (const mId of memberIds) {
        await updateMemberTotals(mId).catch(err => console.error(err));
      }
    }

    return res.json({ status: 'success', message: 'Orders updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Render printable HTML / PDF invoice view for a specific order.
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

// Dispatches order invoice email to the customer or specified recipient email
export const sendOrderInvoiceEmail = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const recipientEmail = String(req.body?.email || req.body?.recipientEmail || "").trim();

    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const order = await OrderModel.findOne(query).lean();
    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    const targetEmail = recipientEmail || order.billingInfo?.email || "";
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return res.status(400).json({
        status: "error",
        message: "A valid recipient email address is required.",
      });
    }

    const subtotal = Number(order.totals?.subtotal || order.subtotal || 0);
    const shippingFee = Number(order.totals?.shippingFee || order.shippingFee || order.shippingTotalAmount || 0);
    const discountAmount = Number(order.discountTotalAmount || order.totals?.discount || 0);
    const calculatedTotal = subtotal + shippingFee - discountAmount;
    const totalAmount = Number(order.totals?.total !== undefined ? order.totals.total : (order.totalAmount !== undefined ? order.totalAmount : calculatedTotal));
    const couponCode = order.couponCode ? String(order.couponCode).trim().toUpperCase() : null;
    const formattedOrderId = order.orderNumber || order.did || order._id?.toString()?.slice(-6);

    const formattedOrderData = {
      orderId: formattedOrderId,
      status: order.status || "processing",
      orderType: order.orderType || "online",
      createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      customerName: order.billingInfo?.fullName || "Valued Customer",
      customerEmail: targetEmail,
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

    let templateConfig = null;
    try {
      const storeSettings = await StoreSettingsModel.findOne({ key: "default" }).lean();
      if (storeSettings?.templates?.isActive) {
        templateConfig = storeSettings.templates;
      }
    } catch (_) {}

    const { transport, config: smtpConfig } = await getSmtpTransport();
    if (!smtpConfig.isConfigured || !transport) {
      return res.status(400).json({
        status: "error",
        message: "SMTP server is not configured. Please configure SMTP in Settings > SMTP Configuration first.",
      });
    }

    const brandDisplayName = smtpConfig.fromName || config.brandName || "Surokkha";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || `no-reply@${config.domain || 'surokkha.store'}`;
    const fromAddress = `"${brandDisplayName}" <${fromEmail}>`;

    const htmlContent = compileTransactionalEmailHtml({
      templateConfig: templateConfig || {},
      order: formattedOrderData,
      clientConfig: config,
    });

    await transport.sendMail({
      from: fromAddress,
      to: targetEmail,
      replyTo: { name: brandDisplayName, address: fromEmail },
      subject: `${brandDisplayName}: Order Invoice & Details - #${formattedOrderId}`,
      html: htmlContent,
    });

    return res.json({
      status: "success",
      message: `Invoice email sent successfully to ${targetEmail}`,
      recipientEmail: targetEmail,
      orderId: formattedOrderId,
    });
  } catch (error) {
    next(error);
  }
};




// Fetch the spam list (Dashboard/Admin only)
export const getSpamList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const query = {};

    const total = await SpamListModel.countDocuments(query);
    const list = await SpamListModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      status: 'success',
      data: list,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete an entry from the spam list (Dashboard/Admin only)
export const deleteSpamListEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await SpamListModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Spam list entry not found' });
    }
    return res.json({ status: 'success', message: 'Entry removed from spam list' });
  } catch (error) {
    next(error);
  }
};
