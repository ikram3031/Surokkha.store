// Generic order domain utilities: validation and number generation.
import { OrderModel } from '../models/order.model.js';
import { config, getClientPolicy } from '../config/index.js';

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
      errors.push('billingInfo.email is required');
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

export const buildOrderNumber = async (orderTypeParam = false, siteOrDomain = null, customPrefix = null) => {
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
    // Resolve online order prefix based on originating storefront site/domain (SST vs SSH)
    const siteKey = String(siteOrDomain || '').toLowerCase().trim();
    if (siteKey === 'shop' || siteKey.includes('surokkha.shop')) {
      prefixType = config.sites?.shop?.orderPrefix || 'SSH';
    } else if (siteKey === 'store' || siteKey.includes('surokkha.store')) {
      prefixType = config.sites?.store?.orderPrefix || 'SST';
    } else {
      prefixType = config.sites?.store?.orderPrefix || config.orderPrefix || 'SST';
    }
  }

  prefixType = prefixType.toUpperCase().trim();
  const prefix = `${prefixType}${shortYear}${month}`;

  const lastOrder = await OrderModel.findOne({
    orderNumber: { $regex: `^${prefix}` }
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();

  let nextSequence = 1;
  if (lastOrder?.orderNumber) {
    const existingSuffix = lastOrder.orderNumber.slice(prefix.length);
    const parsed = parseInt(existingSuffix, 10);
    if (!Number.isNaN(parsed)) {
      nextSequence = parsed + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(3, '0');
  return `${prefix}${paddedSequence}`;
};
