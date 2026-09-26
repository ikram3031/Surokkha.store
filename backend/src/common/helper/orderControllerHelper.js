import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { OrderModel } from '../models/order.model.js';
import { MemberModel } from '../models/member.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { UserModel } from '../models/user.model.js';
import { buildOrderNumber } from './orderHelper.js';
import { config, getClientPolicy } from '../config/index.js';

const { Types } = mongoose;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

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
export const normalizeOrderItems = (items = []) =>
  (items || []).map((item) => ({
    name: item.name ?? item.productName ?? 'Unknown product',
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice ?? item.price ?? 0),
    size: item.size ?? item.variant ?? '',
    concentration: item.concentration ?? '',
    productDid: item.productDid ?? '',
  }));

// Build the Mongo order document from the incoming checkout payload.
export const buildOrderDocument = async (payload) => {
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
  const initialStatus = payload.status 
    ? String(payload.status).toLowerCase() 
    : (isInstore ? 'completed' : 'processing');

  return {
    orderNumber: await buildOrderNumber(isInstore),
    status: ['processing', 'shipped', 'completed', 'cancelled'].includes(initialStatus) ? initialStatus : 'processing',
    createdBy: createdByUserId,
    updatedBy: null,
    member: payload.memberId && Types.ObjectId.isValid(payload.memberId) ? payload.memberId : undefined,
    billingInfo,
    shippingInfo,
    paymentMethod: normalizeText(payload.paymentMethod),
    shippingTotalAmount: Number(payload.shippingTotalAmount || 0),
    discountTotalAmount: Number(payload.discountTotalAmount || 0),
    couponCode: payload.couponCode ? String(payload.couponCode).trim().toUpperCase() : null,
    orderType: isInstore ? 'instore' : 'online',
    items: normalizeOrderItems(payload.items),
    totals: {
      subtotal: Number(payload.subtotal || payload.subTotal || 0),
      shippingFee: Number(payload.shippingFee || payload.shippingTotalAmount || payload.shipping || 0),
      tax: Number(payload.tax || 0),
      total: Number(payload.total || payload.totalAmount || (Number(payload.subtotal || 0) + Number(payload.shippingFee || 0) - Number(payload.discountTotalAmount || 0))),
    },
  };
};

// Upsert the linked payment record so it reflects the created order totals.
// Supports advance, partial, and full payments for COD, Cash, bKash, Nagad, Bank, Card.
export const syncPaymentDocument = async (orderData, payload = {}) => {
  const totalAmount = Number(orderData.totals?.total || 0);

  const isInstore = 
    (payload.orderType === 'instore') || 
    (orderData.orderNumber && orderData.orderNumber.startsWith('IS')) ||
    (orderData.billingInfo?.email && orderData.billingInfo.email.includes('instore@'));

  let paidAmount = 0;
  if (isInstore || orderData.status === 'completed') {
    paidAmount = totalAmount;
  } else if (payload.paymentStatus !== undefined && payload.paymentStatus !== null) {
    const pStatus = String(payload.paymentStatus).toLowerCase();
    if (pStatus === 'paid') {
      paidAmount = totalAmount;
    } else if (pStatus === 'pending') {
      paidAmount = 0;
    } else if (payload.paidAmount !== undefined && payload.paidAmount !== null) {
      paidAmount = Number(payload.paidAmount);
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

  paidAmount = Math.min(totalAmount, Math.max(0, paidAmount));
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = 'pending';
  const rawMethod = normalizeText(orderData.paymentMethod || payload.paymentMethod).toLowerCase();
  const isMfs = ['bkash', 'nagad', 'rocket'].some((m) => rawMethod.includes(m));

  if (isInstore) {
    paymentStatus = 'paid';
  } else if (payload.paymentStatus !== undefined && payload.paymentStatus !== null) {
    const pStatus = String(payload.paymentStatus).toLowerCase();
    if (['paid', 'partial', 'pending', 'n-a'].includes(pStatus)) {
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

  await PaymentModel.findOneAndUpdate(
    { orderId: orderData._id },
    {
      paymentMethod: orderData.paymentMethod,
      paymentPhone,
      totalAmount,
      paidAmount,
      pendingAmount,
      amount: paidAmount,
      status: paymentStatus,
      createdBy: orderData.createdBy || null,
      updatedBy: orderData.updatedBy || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

// Recalculate the aggregate order, paid, and pending totals for a member.
export const computeMemberTotals = async (memberId) => {
  const orders = await OrderModel.find({ member: memberId }).select('paymentMethod totals.total').lean();
  let totalOrderAmount = 0;
  let totalPaidAmount = 0;
  let totalPendingAmount = 0;

  for (const order of orders) {
    const amount = Number(order?.totals?.total || 0);
    totalOrderAmount += amount;
    if (isPaidPaymentMethod(order.paymentMethod)) {
      totalPaidAmount += amount;
    } else {
      totalPendingAmount += amount;
    }
  }

  return { totalOrderAmount, totalPaidAmount, totalPendingAmount };
};

// Apply the recalculated member totals back into the member profile record.
export const updateMemberTotals = async (memberId) => {
  if (!memberId) return;
  const totals = await computeMemberTotals(memberId);
  await MemberModel.findByIdAndUpdate(memberId, totals, { new: true, runValidators: true });
};

// Keep the member's embedded orders list in sync with the latest order reference.
export const updateMemberOrderReference = async (memberId, orderDid, orderValue) => {
  if (!memberId) return;
  await MemberModel.updateOne(
    { _id: memberId },
    {
      $pull: { orders: { did: orderDid } },
      $addToSet: { orders: { did: orderDid, value: orderValue } },
    },
  );
};

// Resolves or creates a Member record if the client has forceMembershipFromOrder enabled.
// Checks for existing member by email or phone before inserting.
export const resolveOrForceMembershipFromOrder = async (createdOrder, payload = {}) => {
  try {
    const isForceMembershipEnabled = Boolean(
      config.forceMembershipFromOrder ||
      getClientPolicy('members.forceMembershipFromOrder') ||
      getClientPolicy('forceMembershipFromOrder')
    );

    // If explicit memberId was passed in payload, use it
    if (createdOrder.member && Types.ObjectId.isValid(createdOrder.member)) {
      return createdOrder.member;
    }
    if (payload.memberId && Types.ObjectId.isValid(payload.memberId)) {
      return payload.memberId;
    }

    if (!isForceMembershipEnabled) {
      return null;
    }

    const billing = createdOrder.billingInfo || payload.billingInfo || {};
    const shipping = createdOrder.shippingInfo || payload.shippingInfo || {};

    const rawEmail = normalizeText(billing.email || payload.email || shipping.email).toLowerCase();
    const rawPhone = normalizeText(billing.phone || payload.phone || shipping.phone);
    const fullName = normalizeText(billing.fullName || payload.fullName || shipping.fullName || payload.name) || 'Customer';

    // Build query conditions for existing member search
    const queryConditions = [];
    if (rawEmail && !rawEmail.startsWith('instore@') && !rawEmail.includes('@store.com')) {
      queryConditions.push({ email: rawEmail });
    }
    if (rawPhone) {
      queryConditions.push({ phone: rawPhone });
    }

    let existingMember = null;
    if (queryConditions.length > 0) {
      existingMember = await MemberModel.findOne({ $or: queryConditions });
    }

    if (existingMember) {
      // Update order with member reference if missing
      if (!createdOrder.member || String(createdOrder.member) !== String(existingMember._id)) {
        await OrderModel.findByIdAndUpdate(createdOrder._id, { member: existingMember._id });
        createdOrder.member = existingMember._id;
      }
      return existingMember._id;
    }

    // Otherwise create new member
    const domain = config.domain || 'surokkha.store';
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '');
    const fallbackEmail = rawEmail || (cleanPhoneDigits ? `${cleanPhoneDigits}@${domain}` : `customer_${Date.now()}@${domain}`);
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const newMemberData = {
      name: fullName,
      email: fallbackEmail,
      phone: rawPhone,
      passwordHash,
      isActive: true,
      role: 'Customer',
      isEmailVerified: Boolean(rawEmail),
      billingAddress: {
        firstName,
        lastName,
        address1: normalizeText(billing.address || shipping.address),
        city: normalizeText(billing.district || shipping.district),
        state: normalizeText(billing.thana || shipping.thana),
        postcode: normalizeText(billing.zip || shipping.zip),
        country: 'Bangladesh',
        email: fallbackEmail,
        phone: rawPhone,
      },
      shippingAddress: {
        firstName,
        lastName,
        address1: normalizeText(shipping.address || billing.address),
        city: normalizeText(shipping.district || billing.district),
        state: normalizeText(shipping.thana || billing.thana),
        postcode: normalizeText(shipping.zip || billing.zip),
        country: 'Bangladesh',
        email: fallbackEmail,
        phone: rawPhone,
      },
      orders: [
        {
          did: createdOrder.did,
          value: Number(createdOrder.totals?.total || 0),
        },
      ],
      totalOrderAmount: Number(createdOrder.totals?.total || 0),
    };

    const createdMember = await MemberModel.create(newMemberData);

    // Link the created member to the created order
    await OrderModel.findByIdAndUpdate(createdOrder._id, { member: createdMember._id });
    createdOrder.member = createdMember._id;

    return createdMember._id;
  } catch (error) {
    console.error('[resolveOrForceMembershipFromOrder] Failed to force create/resolve member:', error);
    return null;
  }
};

// Persist the created order snapshot onto the member and refresh derived totals.
export const syncMemberOrderSnapshot = async (memberId, createdOrder, payload) => {
  if (!memberId) return;

  const orderValue = createdOrder.totals?.total ?? 0;
  const memberUpdates = { $addToSet: { orders: { did: createdOrder.did, value: orderValue } } };

  if (payload.billingInfo && typeof payload.billingInfo === 'object') {
    memberUpdates.$set = { ...(memberUpdates.$set || {}), billingInfo: payload.billingInfo };
  }
  if (payload.shippingInfo && typeof payload.shippingInfo === 'object') {
    memberUpdates.$set = { ...(memberUpdates.$set || {}), shippingInfo: payload.shippingInfo };
  }

  await MemberModel.findByIdAndUpdate(memberId, memberUpdates, { new: true, runValidators: true });
  await updateMemberTotals(memberId);
};

// Produce the safe subset of order fields that can be updated from request input.
export const buildAllowedOrderUpdates = async (payload, existingOrder) => {
  const allowedUpdates = {};

  if (payload.status) {
    const s = String(payload.status).toLowerCase();
    const validEnums = ['processing', 'shipped', 'completed', 'cancelled'];
    allowedUpdates.status = validEnums.includes(s) ? s : 'processing';
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
  if (payload.paidAmount !== undefined) {
    allowedUpdates.paidAmount = Number(payload.paidAmount || 0);
  }
  if (payload.paymentPhone !== undefined) {
    allowedUpdates.paymentPhone = normalizeText(payload.paymentPhone);
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
    allowedUpdates.items = normalizeOrderItems(payload.items);
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
