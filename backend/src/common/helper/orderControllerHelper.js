import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { OrderModel } from '../models/order.model.js';
import { ProductModel } from '../models/product.model.js';
import { ItemModel } from '../models/item.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { UserModel } from '../models/user.model.js';
import { FakeOrderModel } from '../models/fakeOrder.model.js';
import { buildOrderNumber } from './orderHelper.js';
import { config, getClientPolicy } from '../config/index.js';
import { extractClientIp } from '../services/facebookCapi.service.js';

const { Types } = mongoose;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

// Extracts payer number and transaction reference from storefront checkout paymentDetails (bKash, Nagad, Bank)
export const extractPaymentReference = (payload = {}) => {
  const d = payload.paymentDetails && typeof payload.paymentDetails === 'object' ? payload.paymentDetails : {};
  const payerNumber = normalizeText(d.bkashNumber || d.nagadNumber || d.rocketNumber || d.payerNumber || '');
  const bankRef = [normalizeText(d.bankName || ''), normalizeText(d.bankAccountNumber || '')].filter(Boolean).join(' / ');
  const transactionId = normalizeText(d.bkashTxnId || d.nagadTxnId || d.rocketTxnId || d.transactionId || '') || bankRef;
  return { payerNumber, transactionId };
};

// Determine whether the payment method should be treated as a paid order path.
export const isPaidPaymentMethod = (paymentMethod) => {
  const method = normalizeText(paymentMethod).toLowerCase();
  if (!method) return false;
  return method === 'cod' || method.includes('cash') || method.includes('full') || method === 'paid';
};

// Resolve the effective payment status for an order based on method and amount paid.
export const getPaymentStatus = (paymentMethod, totalAmount, paidAmount) => {
  const method = normalizeText(paymentMethod).toLowerCase();
  if (!method) return 'pending';
  const isMfs = ['bkash', 'nagad', 'rocket'].some((m) => method.includes(m));

  if (paidAmount >= totalAmount && totalAmount > 0) return 'paid';
  if (paidAmount > 0 || isMfs) return 'partial';
  return 'pending';
};

// Resolve a user reference into a stable Mongo ObjectId or return null when absent.
export const resolveUserIdFromReference = async (reference) => {
  const rawReference = normalizeText(reference);
  if (!rawReference) return null;

  if (Types.ObjectId.isValid(rawReference)) {
    return rawReference;
  }

  const foundUser = await UserModel.findOne({ did: rawReference }).select('_id').lean();
  return foundUser?._id ?? null;
};

// Normalize checkout items into the order schema shape expected by the database.
// Supports both 'Product' and 'Item' collections, variant sizes, skus, and IDs seamlessly.
export const normalizeOrderItems = async (items = []) => {
  const normalized = (items || []).map((item) => {
    const rawRef = item.productId || item.itemId || item.id || item._id || item.productDid || '';
    const itemType = item.itemType || (item.itemId ? 'item' : item.productId ? 'product' : 'product');
    return {
      name: item.name ?? item.productName ?? 'Unknown product',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice ?? item.price ?? 0),
      size: item.size ?? item.variant ?? '',
      concentration: item.concentration ?? '',
      productDid: item.productDid ?? (typeof rawRef === 'string' && rawRef.length === 16 ? rawRef : ''),
      productId: item.productId || (itemType === 'product' && rawRef ? String(rawRef) : ''),
      itemId: item.itemId || (itemType === 'item' && rawRef ? String(rawRef) : ''),
      itemType: itemType,
      sku: item.sku || '',
      image: item.image || item.imageUrl || '',
    };
  });

  const needsResolution = normalized.filter((item) => !item.productDid || item.productDid.length !== 16);
  if (needsResolution.length > 0) {
    const refs = needsResolution.map((i) => i.productId || i.itemId || i.productDid).filter(Boolean);
    const objectIds = refs.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const slugs = refs;
    const names = needsResolution.map((i) => i.name).filter(Boolean);

    // Search in both Product and Item collections
    const [foundProds, foundItems] = await Promise.all([
      ProductModel.find({
        $or: [
          ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
          { did: { $in: slugs } },
          { slug: { $in: slugs } },
          { name: { $in: names } },
        ],
      }, '_id did slug name sku type').lean(),
      ItemModel.find({
        $or: [
          ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
          { did: { $in: slugs } },
          { slug: { $in: slugs } },
          { name: { $in: names } },
        ],
      }, '_id did slug name sku type').lean(),
    ]);

    const buildLookupMaps = (docs, defaultType) => {
      const byId = new Map();
      const byDid = new Map();
      const bySlug = new Map();
      const byName = new Map();
      for (const d of docs) {
        const info = { did: d.did, id: d._id.toString(), sku: d.sku || '', type: defaultType };
        byId.set(d._id.toString(), info);
        if (d.did) byDid.set(d.did, info);
        if (d.slug) bySlug.set(d.slug, info);
        if (d.name) byName.set(d.name, info);
      }
      return { byId, byDid, bySlug, byName };
    };

    const prodMaps = buildLookupMaps(foundProds, 'product');
    const itemMaps = buildLookupMaps(foundItems, 'item');

    for (const item of needsResolution) {
      const key = item.productId || item.itemId || item.productDid;
      const resolved = 
        prodMaps.byId.get(key) || prodMaps.byDid.get(key) || prodMaps.bySlug.get(key) || prodMaps.byName.get(item.name) ||
        itemMaps.byId.get(key) || itemMaps.byDid.get(key) || itemMaps.bySlug.get(key) || itemMaps.byName.get(item.name);

      if (resolved) {
        item.productDid = resolved.did;
        if (resolved.type === 'item') {
          item.itemId = resolved.id;
          item.itemType = 'item';
        } else {
          item.productId = resolved.id;
          item.itemType = 'product';
        }
        if (!item.sku && resolved.sku) {
          item.sku = resolved.sku;
        }
      }
    }
  }

  return normalized;
};

// Build the Mongo order document from the incoming checkout payload.
export const buildOrderDocument = async (payload, req = null) => {
  const createdByUserId = await resolveUserIdFromReference(payload.createdBy);

  const billingInfo = {
    fullName: normalizeText(payload.billingInfo?.fullName || payload.fullName),
    phone: normalizeText(payload.billingInfo?.phone || payload.phone),
    email: normalizeText(payload.billingInfo?.email || payload.email),
    address: normalizeText(payload.billingInfo?.address || payload.address),
    thana: normalizeText(payload.billingInfo?.thana || payload.thana),
    district: normalizeText(payload.billingInfo?.district || payload.district),
    zip: normalizeText(payload.billingInfo?.zip || payload.zip),
  };

  const hasCustomShipping = payload.shippingInfo && 
    (normalizeText(payload.shippingInfo.address) || normalizeText(payload.shippingInfo.street));

  const shippingInfo = hasCustomShipping
    ? {
        fullName: normalizeText(payload.shippingInfo.fullName || billingInfo.fullName),
        phone: normalizeText(payload.shippingInfo.phone || billingInfo.phone),
        address: normalizeText(payload.shippingInfo.address || payload.shippingInfo.street || billingInfo.address),
        thana: normalizeText(payload.shippingInfo.thana || billingInfo.thana),
        district: normalizeText(payload.shippingInfo.district || billingInfo.district),
        zip: normalizeText(payload.shippingInfo.zip || billingInfo.zip),
      }
    : { ...billingInfo };

  const isInstore = payload.orderType === 'instore';
  const isCustom = payload.orderType === 'custom';
  // Every new order (online, custom, in-store) starts as pending regardless of input
  const initialStatus = 'pending';
  const resolvedOrderType = isCustom ? 'custom' : isInstore ? 'instore' : 'online';
  const resolvedSiteKey = 'shop';
  const resolvedDomain = payload.clientDomain || 'surokkha.shop';
  // A custom order may carry its own prefix (e.g. SC from offer.surokkha.store); dashboard custom orders stay CO
  const explicitCustomPrefix = isCustom && /^[A-Z]{2}$/.test(String(payload.orderPrefix || '').trim().toUpperCase())
    ? String(payload.orderPrefix).trim().toUpperCase()
    : null;
  const customPrefix = explicitCustomPrefix || (isCustom ? 'CO' : isInstore ? 'IS' : (payload.orderPrefix || 'SH'));

    const calculatedTotal = Number(payload.total || payload.totalAmount || (Number(payload.subtotal || 0) + Number(payload.shippingFee || payload.shippingTotalAmount || 0) - Number(payload.discountTotalAmount || 0)));
  const rawMethod = normalizeText(payload.paymentMethod).toLowerCase();
  const isCash = rawMethod === 'cash' || rawMethod === 'instore';
  const hasExplicitPaid = payload.paidAmount !== undefined && payload.paidAmount !== null && payload.paidAmount !== '';
  // An explicit paid amount from the dashboard always wins; in-store/cash default to fully paid.
  const initialPaidAmount = hasExplicitPaid
    ? Math.min(calculatedTotal, Math.max(0, Number(payload.paidAmount) || 0))
    : (isInstore || isCash ? calculatedTotal : 0);
  const paymentReference = extractPaymentReference(payload);
  let initialPaymentStatus = 'pending';
  if (payload.paymentStatus && !hasExplicitPaid) {
    initialPaymentStatus = String(payload.paymentStatus).toLowerCase().trim();
  } else if (initialPaidAmount >= calculatedTotal && calculatedTotal > 0) {
    initialPaymentStatus = 'paid';
  } else if (initialPaidAmount > 0) {
    initialPaymentStatus = 'partial';
  }

  return {
    orderNumber: await buildOrderNumber(explicitCustomPrefix ? false : resolvedOrderType, resolvedSiteKey, customPrefix),
    siteKey: resolvedSiteKey,
    clientDomain: resolvedDomain,
    status: initialStatus,
    createdBy: createdByUserId,
    updatedBy: null,
    billingInfo,
    shippingInfo,
    paymentMethod: normalizeText(payload.paymentMethod),
    paymentStatus: initialPaymentStatus,
    paidAmount: initialPaidAmount,
    paymentPhone: normalizeText(payload.paymentPhone || paymentReference.payerNumber || ''),
    paymentTransactionId: normalizeText(payload.paymentTransactionId || paymentReference.transactionId || ''),
    shippingTotalAmount: Number(payload.shippingTotalAmount || payload.shippingFee || 0),
    discountTotalAmount: Number(payload.discountTotalAmount || 0),
    couponCode: payload.couponCode ? String(payload.couponCode).trim().toUpperCase() : null,
    orderType: resolvedOrderType,
    items: await normalizeOrderItems(payload.items),
    totals: {
      subtotal: Number(payload.subtotal || payload.subTotal || 0),
      shippingFee: Number(payload.shippingFee || payload.shippingTotalAmount || payload.shipping || 0),
      tax: Number(payload.tax || 0),
      total: calculatedTotal,
    },
    ipAddress: normalizeText(payload.ipAddress || (req ? extractClientIp(req) : '')) || null,
    fb_login_id: normalizeText(payload.fb_login_id || payload.fbLoginId || req?.body?.fb_login_id || req?.body?.fbLoginId || req?.cookies?.fb_login_id || req?.cookies?._fb_login_id || '') || null,
  };
};

// Payment collection opens only once an order is shipped; pending/processing orders have no payment record.
export const PAYMENT_COLLECTION_STATUSES = ['shipped', 'completed', 'return'];

// True when the order already has a payment record or has reached a status that opens payment collection.
export const canHavePaymentDocument = async (order) => {
  if (!order?._id) return false;
  if (PAYMENT_COLLECTION_STATUSES.includes(String(order.status || '').toLowerCase())) return true;
  return Boolean(await PaymentModel.exists({ orderId: order._id }));
};

// Creates the payment record the first time an order reaches shipped (no-op if it already exists).
export const ensurePaymentOnShip = async (order, payload = {}) => {
  if (!order?._id) return;
  if (!PAYMENT_COLLECTION_STATUSES.includes(String(order.status || '').toLowerCase())) return;
  if (await PaymentModel.exists({ orderId: order._id })) return;
  await syncPaymentDocument(order, payload);
};

// Upsert the linked payment record so it reflects the created order totals.
// Supports advance, partial, and full payments for COD, Cash, bKash, Nagad, Bank, Card.
export const syncPaymentDocument = async (orderData, payload = {}) => {
  const totalAmount = Number(orderData.totals?.total ?? orderData.totalAmount ?? 0);

  const isInstore = 
    (payload.orderType === 'instore') || 
    (orderData.orderNumber && orderData.orderNumber.startsWith('IS')) ||
    (orderData.billingInfo?.email && orderData.billingInfo.email.includes('instore@'));

  const hasExplicitPaid = payload.paidAmount !== undefined && payload.paidAmount !== null && payload.paidAmount !== '';
  const hasExplicitPaymentStatus = payload.paymentStatus !== undefined && payload.paymentStatus !== null;
  let paidAmount = 0;
  if (hasExplicitPaid) {
    // Dashboard-entered paid amount is the source of truth for the payment collection.
    paidAmount = Number(payload.paidAmount) || 0;
  } else if (isInstore || (orderData.status === 'completed' && !hasExplicitPaymentStatus)) {
    paidAmount = totalAmount;
  } else if (payload.paymentStatus !== undefined && payload.paymentStatus !== null) {
    const pStatus = String(payload.paymentStatus).toLowerCase();
    if (pStatus === 'paid') {
      paidAmount = totalAmount;
    } else if (pStatus === 'pending') {
      paidAmount = 0;
    } else if (payload.paidAmount !== undefined && payload.paidAmount !== null) {
      paidAmount = Number(payload.paidAmount);
    } else if (orderData.paidAmount !== undefined && orderData.paidAmount !== null) {
      paidAmount = Number(orderData.paidAmount);
    } else {
      paidAmount = 0;
    }
  } else if (payload.paidAmount !== undefined && payload.paidAmount !== null) {
    paidAmount = Number(payload.paidAmount);
  } else if (orderData.paidAmount !== undefined && orderData.paidAmount !== null) {
    paidAmount = Number(orderData.paidAmount);
  } else if (orderData.paymentDetails?.paidAmount !== undefined) {
    paidAmount = Number(orderData.paymentDetails.paidAmount);
  } else {
    const method = normalizeText(orderData.paymentMethod).toLowerCase();
    if (method === 'cash' || method === 'instore' || method === 'in-store') {
      paidAmount = totalAmount;
    } else {
      paidAmount = 0;
    }
  }

  const orderCanceled = orderData.status === 'canceled' || orderData.status === 'cancelled' || orderData.status === 'fake';
  const orderReturned = orderData.status === 'return';
  // Cancelled, fake and returned orders collect nothing and owe nothing
  if (orderCanceled || orderReturned) {
    paidAmount = 0;
  }

  paidAmount = Math.min(totalAmount, Math.max(0, paidAmount));
  const pendingAmount = orderCanceled || orderReturned ? 0 : Math.max(0, totalAmount - paidAmount);

  let paymentStatus = 'pending';
  const rawMethod = normalizeText(orderData.paymentMethod || payload.paymentMethod).toLowerCase();
  const isMfs = ['bkash', 'nagad', 'rocket'].some((m) => rawMethod.includes(m));

  if (orderCanceled) {
    paymentStatus = 'cancelled';
  } else if (orderReturned) {
    paymentStatus = 'returned';
  } else if (isInstore && !hasExplicitPaid) {
    paymentStatus = 'paid';
  } else if (!hasExplicitPaid && payload?.paymentStatus !== undefined && payload?.paymentStatus !== null) {
    const pStatus = String(payload.paymentStatus).toLowerCase();
    if (['paid', 'partial', 'pending', 'n-a', 'cancelled', 'returned'].includes(pStatus)) {
      paymentStatus = pStatus;
    } else {
      if (paidAmount >= totalAmount && totalAmount > 0) {
        paymentStatus = 'paid';
      } else if (paidAmount > 0 || isMfs) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'pending';
      }
    }
  } else {
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0 || isMfs) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }
  }

  const paymentPhone =
    orderData.paymentPhone ||
    orderData.paymentDetails?.paymentPhone ||
    orderData.billingInfo?.phone ||
    '';

  // Pending/processing orders keep payment info on the order only; the payment record is created on first ship
  if (await canHavePaymentDocument(orderData)) await PaymentModel.findOneAndUpdate(
    { orderId: orderData._id },
    {
      paymentMethod: orderData.paymentMethod,
      paymentPhone,
      transactionId: orderData.paymentTransactionId || '',
      totalAmount,
      paidAmount,
      pendingAmount,
      amount: paidAmount,
      status: paymentStatus,
      isActive: !orderCanceled && !orderReturned,
      active: !orderCanceled && !orderReturned,
      createdBy: orderData.createdBy || null,
      updatedBy: orderData.updatedBy || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (orderData._id) {
    await OrderModel.findByIdAndUpdate(orderData._id, {
      paymentStatus,
      paidAmount,
      paymentPhone,
    });
    orderData.paymentStatus = paymentStatus;
    orderData.paidAmount = paidAmount;
    orderData.paymentPhone = paymentPhone;
  }
};

// No-ops retained for import compatibility — Member collection not used in this client.
export const computeMemberTotals = async () => ({ totalOrderAmount: 0, totalPaidAmount: 0, totalPendingAmount: 0 });
export const updateMemberTotals = async () => {};
export const updateMemberOrderReference = async () => {};
export const resolveOrForceMembershipFromOrder = async () => null;
export const syncMemberOrderSnapshot = async () => {};

// Produce the safe subset of order fields that can be updated from request input.
export const buildAllowedOrderUpdates = async (payload, existingOrder) => {
  const allowedUpdates = {};

  if (payload.status) {
    const s = String(payload.status).toLowerCase();
    const validEnums = ['pending', 'processing', 'hold', 'shipped', 'completed', 'cancelled', 'fake', 'return'];
    allowedUpdates.status = validEnums.includes(s) ? s : 'pending';
  }
  if (payload.shippingInfo) {
    allowedUpdates.shippingInfo = {
      fullName: normalizeText(payload.shippingInfo.fullName) || existingOrder.shippingInfo?.fullName || '',
      phone: normalizeText(payload.shippingInfo.phone) || existingOrder.shippingInfo?.phone || '',
      address: normalizeText(payload.shippingInfo.address) || existingOrder.shippingInfo?.address || '',
      thana: normalizeText(payload.shippingInfo.thana) || existingOrder.shippingInfo?.thana || '',
      district: normalizeText(payload.shippingInfo.district) || existingOrder.shippingInfo?.district || '',
      zip: normalizeText(payload.shippingInfo.zip) || existingOrder.shippingInfo?.zip || '',
    };
  }
  if (payload.paymentMethod) {
    allowedUpdates.paymentMethod = payload.paymentMethod;
  }
  // Trash restore sends { active: true }; updateOrder still forces active=false for fake orders
  if (typeof payload.active === 'boolean') {
    allowedUpdates.active = payload.active;
  }
  if (payload.paidAmount !== undefined) {
    allowedUpdates.paidAmount = Number(payload.paidAmount || 0);
  }
  if (payload.paymentPhone !== undefined) {
    allowedUpdates.paymentPhone = normalizeText(payload.paymentPhone);
  }
  if (payload.paymentTransactionId !== undefined) {
    allowedUpdates.paymentTransactionId = normalizeText(payload.paymentTransactionId);
  }
  if (allowedUpdates.status === 'return' || String(payload.status || '').toLowerCase().trim() === 'return') {
    allowedUpdates.paymentStatus = 'returned';
    allowedUpdates.paidAmount = 0;
  } else if (payload.paymentStatus !== undefined && payload.paymentStatus !== null) {
    let rawStatus = String(payload.paymentStatus).toLowerCase().trim();
    if (rawStatus === 'n/a') rawStatus = 'n-a';
    allowedUpdates.paymentStatus = rawStatus;
  } else if (payload.paidAmount !== undefined) {
    const currentTotal = Number(payload.totals?.total ?? existingOrder.totals?.total ?? 0);
    const paid = Number(payload.paidAmount || 0);
    if (paid >= currentTotal && currentTotal > 0) {
      allowedUpdates.paymentStatus = 'paid';
    } else if (paid > 0) {
      allowedUpdates.paymentStatus = 'partial';
    } else {
      allowedUpdates.paymentStatus = 'pending';
    }
  }
  if (payload.totals) {
    allowedUpdates.totals = payload.totals;
  }
  if (payload.discountTotalAmount !== undefined) {
    allowedUpdates.discountTotalAmount = Number(payload.discountTotalAmount || 0);
  }
  if (payload.shippingTotalAmount !== undefined) {
    allowedUpdates.shippingTotalAmount = Number(payload.shippingTotalAmount || 0);
  }

  const customerInfo = payload.billingInfo || payload.customer;
  if (customerInfo) {
    allowedUpdates.billingInfo = {
      fullName: normalizeText(customerInfo.fullName || customerInfo.name) || existingOrder.billingInfo?.fullName || '',
      phone: normalizeText(customerInfo.phone) || existingOrder.billingInfo?.phone || '',
      email: normalizeText(customerInfo.email) || existingOrder.billingInfo?.email || '',
      address: normalizeText(customerInfo.address || customerInfo.street) || existingOrder.billingInfo?.address || '',
      thana: normalizeText(customerInfo.thana) || existingOrder.billingInfo?.thana || '',
      district: normalizeText(customerInfo.district) || existingOrder.billingInfo?.district || '',
      zip: normalizeText(customerInfo.zip) || existingOrder.billingInfo?.zip || '',
    };

    if (!payload.shippingInfo) {
      allowedUpdates.shippingInfo = { ...allowedUpdates.billingInfo };
    }
  }

  if (payload.items) {
    allowedUpdates.items = await normalizeOrderItems(payload.items);
  }
  if (payload.memberId !== undefined) {
    if (payload.memberId && Types.ObjectId.isValid(payload.memberId)) {
      allowedUpdates.member = payload.memberId;
    } else if (payload.memberId === null) {
      allowedUpdates.member = undefined;
    }
  }
  if (payload.updatedBy !== undefined) {
    const rawUpdatedBy = normalizeText(payload.updatedBy);
    allowedUpdates.updatedBy = rawUpdatedBy ? await resolveUserIdFromReference(rawUpdatedBy) : null;
  }

  return allowedUpdates;
};

// Archives a fake order into the dedicated fake_orders collection.
export const archiveFakeOrder = async (orderDoc, actorUserId = null, reason = "Marked as fake order") => {
  if (!orderDoc || !orderDoc._id) return null;
  try {
    const customer = {
      fullName: orderDoc.billingInfo?.fullName || orderDoc.shippingInfo?.fullName || "",
      phone: orderDoc.billingInfo?.phone || orderDoc.shippingInfo?.phone || "",
      email: orderDoc.billingInfo?.email || orderDoc.shippingInfo?.email || "",
      address: orderDoc.billingInfo?.address || orderDoc.shippingInfo?.address || "",
      thana: orderDoc.billingInfo?.thana || orderDoc.shippingInfo?.thana || "",
      district: orderDoc.billingInfo?.district || orderDoc.shippingInfo?.district || "",
      zip: orderDoc.billingInfo?.zip || orderDoc.shippingInfo?.zip || "",
    };

    const record = await FakeOrderModel.findOneAndUpdate(
      { orderId: orderDoc._id },
      {
        orderId: orderDoc._id,
        orderNumber: orderDoc.orderNumber,
        did: orderDoc.did,
        orderType: orderDoc.orderType || "online",
        customer,
        billingInfo: orderDoc.billingInfo || {},
        shippingInfo: orderDoc.shippingInfo || {},
        items: orderDoc.items || [],
        totals: orderDoc.totals || {},
        paymentMethod: orderDoc.paymentMethod || "",
        member: orderDoc.member || null,
        markedBy: actorUserId || null,
        originalCreatedAt: orderDoc.createdAt || new Date(),
        reason: reason || "Marked as fake order",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return record;
  } catch (err) {
    console.error(`[archiveFakeOrder] Failed to archive fake order ${orderDoc._id}:`, err);
    return null;
  }
};
