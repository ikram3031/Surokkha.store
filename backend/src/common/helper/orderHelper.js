// Generic order domain utilities: validation and number generation.
import { OrderModel } from '../models/order.model.js';
import { config, getClientPolicy } from '../config/index.js';
import { nextFormattedId } from '../services/idFormat.service.js';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Pushes address detail errors (minimum address length, mandatory thana/area) per client checkout policy
const validateAddressDetail = (info, prefix, errors) => {
  const minAddressLength = Number(getClientPolicy('checkout.minAddressLength', 0)) || 0;
  const requireArea = getClientPolicy('checkout.requireArea', false) === true;
  const address = typeof info?.address === 'string' ? info.address.trim() : '';
  const thana = typeof info?.thana === 'string' ? info.thana.trim() : '';
  if (address && minAddressLength > 0 && address.length < minAddressLength) {
    errors.push(`${prefix}.address must be at least ${minAddressLength} characters (house, road, area)`);
  }
  if (requireArea && !thana) {
    errors.push(`${prefix}.thana (area) is required`);
  }
};

export const validateOrderPayload = (body) => {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return ['Request body must be a valid JSON object'];
  }

  const isInstore = body.orderType === 'instore';
  const isCustom = body.orderType === 'custom';
  // Store (surokkhastore.shop) checkouts mark email optional, so ST orders may arrive without one
  const isEmailOptional = String(body.orderPrefix || '').trim().toUpperCase() === 'ST';

  // 1. Validate billingInfo (Mandatory for online and custom orders)
  const billing = body.billingInfo || {};
  
  // Fallback to root level fields if billingInfo is completely missing (backward compatibility)
  const hasBillingInfo = !!body.billingInfo;
  const fullName = hasBillingInfo ? billing.fullName : body.fullName;
  const phone = hasBillingInfo ? billing.phone : body.phone;
  const email = hasBillingInfo ? billing.email : body.email;
  const address = hasBillingInfo ? billing.address : body.address;
  const district = hasBillingInfo ? billing.district : body.district;

  if (typeof fullName !== 'string' || fullName.trim() === '') {
    errors.push('billingInfo.fullName is required');
  }
  if (typeof phone !== 'string' || phone.trim() === '') {
    errors.push('billingInfo.phone is required');
  }

  if (!isInstore && !isCustom) {
    // Online customer storefront orders require email, address, district
    if (typeof email !== 'string' || email.trim() === '') {
      if (!isEmailOptional) errors.push('billingInfo.email is required');
    } else if (!isValidEmail(email)) {
      errors.push('billingInfo.email must be a valid email address');
    }
    
    if (typeof address !== 'string' || address.trim() === '') {
      errors.push('billingInfo.address is required');
    }
    if (typeof district !== 'string' || district.trim() === '') {
      errors.push('billingInfo.district is required');
    }
    validateAddressDetail(hasBillingInfo ? billing : body, 'billingInfo', errors);
  } else if (isCustom) {
    // Custom orders require address & district for delivery, email is optional but validated if provided
    if (typeof address !== 'string' || address.trim() === '') {
      errors.push('billingInfo.address is required');
    }
    if (typeof district !== 'string' || district.trim() === '') {
      errors.push('billingInfo.district is required');
    }
    if (email && typeof email === 'string' && email.trim() !== '') {
      if (!isValidEmail(email)) {
        errors.push('billingInfo.email must be a valid email address');
      }
    }
  } else if (email && typeof email === 'string' && email.trim() !== '') {
    if (!isValidEmail(email)) {
      errors.push('billingInfo.email must be a valid email address');
    }
  }

  // 2. Validate shippingInfo (Mandatory ONLY if shipToDifferentAddress is true or custom shippingInfo is provided)
  const shipToDifferent = body.shipToDifferentAddress === true || (body.shippingInfo && typeof body.shippingInfo === 'object' && Object.keys(body.shippingInfo).length > 0);
  
  if (shipToDifferent && !isInstore) {
    const shipping = body.shippingInfo || {};
    if (typeof shipping.fullName !== 'string' || shipping.fullName.trim() === '') {
      errors.push('shippingInfo.fullName is required when shipping to a different address');
    }
    if (typeof shipping.phone !== 'string' || shipping.phone.trim() === '') {
      errors.push('shippingInfo.phone is required when shipping to a different address');
    }
    if (typeof shipping.address !== 'string' || shipping.address.trim() === '') {
      errors.push('shippingInfo.address is required when shipping to a different address');
    }
    if (typeof shipping.district !== 'string' || shipping.district.trim() === '') {
      errors.push('shippingInfo.district is required when shipping to a different address');
    }
    if (!isCustom) {
      validateAddressDetail(shipping, 'shippingInfo', errors);
    }
  }

  // 3. Items validation
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('items must be a non-empty array');
  }

  // 4. Payment method validation
  if (typeof body.paymentMethod !== 'string' || body.paymentMethod.trim() === '') {
    errors.push('paymentMethod is required');
  }

  return errors;
};

// Custom order numbers: AC001…AC999, BC001…BC999, …, ZC999, AAC001… (letters count like spreadsheet columns).
const lettersToIndex = (letters) => [...letters].reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0);
const indexToLetters = (index) => {
  let out = '';
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
  return out;
};

export const buildCustomOrderNumber = async () => {
  const existing = await OrderModel.find({ orderNumber: { $regex: '^[A-Z]+C\\d{3}$' } })
    .select('orderNumber')
    .lean();

  let last = 0; // position in the overall sequence: (letterIndex - 1) * 999 + serial
  for (const { orderNumber } of existing) {
    const letters = orderNumber.slice(0, -4);
    const serial = parseInt(orderNumber.slice(-3), 10);
    if (!serial) continue;
    const position = (lettersToIndex(letters) - 1) * 999 + serial;
    if (position > last) last = position;
  }

  const next = last + 1;
  const letterIndex = Math.floor((next - 1) / 999) + 1;
  const serial = ((next - 1) % 999) + 1;
  return `${indexToLetters(letterIndex)}C${String(serial).padStart(3, '0')}`;
};

// Store (surokkhastore.shop) orders: <batch>ST<YY><NN>, e.g. 0ST2601 … 0ST2699, then 1ST2601.
// NN runs 01–99 inside a batch; the batch starts at 0 and the whole count restarts each year.
const STORE_SERIALS_PER_BATCH = 99;
const buildStoreOrderNumber = async () => {
  const yy = String(new Date().getFullYear()).slice(-2);
  const pattern = new RegExp(`^(\\d+)ST${yy}(\\d{2})$`);
  const existing = await OrderModel.find({ orderNumber: { $regex: `^\\d+ST${yy}\\d{2}$` } })
    .select('orderNumber')
    .lean();

  let last = 0;
  for (const { orderNumber } of existing) {
    const m = pattern.exec(orderNumber);
    if (!m) continue;
    const position = Number(m[1]) * STORE_SERIALS_PER_BATCH + Number(m[2]);
    if (position > last) last = position;
  }

  const next = last + 1;
  const batch = Math.floor((next - 1) / STORE_SERIALS_PER_BATCH);
  const serial = ((next - 1) % STORE_SERIALS_PER_BATCH) + 1;
  return `${batch}ST${yy}${String(serial).padStart(2, '0')}`;
};

// Which Business Settings ID format an order uses; null for a dashboard-chosen prefix, which keeps its own numbering
const orderIdType = (orderTypeParam, customPrefix) => {
  const prefix = String(customPrefix || '').trim().toUpperCase();
  if (orderTypeParam === 'custom' || orderTypeParam === 'co') return 'orderCustom';
  if (orderTypeParam === true || orderTypeParam === 'instore' || orderTypeParam === 'is') return 'orderInstore';
  if (prefix === 'ST') return 'orderStore';
  if (!prefix || prefix === 'SH' || prefix === String(config.sites?.shop?.orderPrefix || '').toUpperCase()) return 'orderShop';
  return null;
};

export const buildOrderNumber = async (orderTypeParam = false, siteOrDomain = null, customPrefix = null) => {
  const idType = orderIdType(orderTypeParam, customPrefix);
  if (idType) {
    const formatted = await nextFormattedId(idType, (id) => OrderModel.exists({ orderNumber: id }));
    if (formatted) return formatted;
  }

  if (orderTypeParam === 'custom' || orderTypeParam === 'co') return buildCustomOrderNumber();
  if (String(customPrefix || '').trim().toUpperCase() === 'ST' && orderTypeParam !== 'instore' && orderTypeParam !== true) {
    return buildStoreOrderNumber();
  }

  const now = new Date();
  const shortYear = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');

  let prefixType = '';

  if (orderTypeParam === 'custom' || orderTypeParam === 'co') {
    prefixType = 'CO';
  } else if (orderTypeParam === true || orderTypeParam === 'instore' || orderTypeParam === 'is') {
    prefixType = 'IS';
  } else if (customPrefix && typeof customPrefix === 'string' && customPrefix.trim()) {
    prefixType = customPrefix.toUpperCase().trim();
  } else {
    prefixType = config.sites?.shop?.orderPrefix || config.orderPrefix || 'SH';
  }

  prefixType = prefixType.toUpperCase().trim();
  const prefix = `${prefixType}${shortYear}${month}`;

  // Sorting orderNumber as a string breaks once the monthly sequence rolls past 3
  // digits (e.g. "...999" sorts after "...1000"), which can hand two different
  // orders the same number. Compare the numeric suffix instead of the raw string.
  const matchingOrders = await OrderModel.find({
    orderNumber: { $regex: `^${prefix}\\d+$` }
  })
    .select('orderNumber')
    .lean();

  let nextSequence = 1;
  for (const { orderNumber } of matchingOrders) {
    const parsed = parseInt(orderNumber.slice(prefix.length), 10);
    if (!Number.isNaN(parsed) && parsed + 1 > nextSequence) {
      nextSequence = parsed + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(3, '0');
  return `${prefix}${paddedSequence}`;
};
