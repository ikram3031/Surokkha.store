/**
 * WhatsApp integration utilities for Surokkha Catalog
 * WhatsApp phone number: 01600905774 (wa.me/8801600905774)
 */

import { toBengaliNumber } from './formatters';

export const WHATSAPP_PHONE = '8801600905774';
export const DISPLAY_PHONE = '01600905774';

/**
 * Builds the WhatsApp direct chat link with prefilled message
 */
export const buildWhatsAppLink = (message) => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
};

/**
 * Generates prefilled WhatsApp text for a single product order (Product Modal)
 */
export const generateSingleProductOrderMessage = (product, quantity = 1) => {
  const qty = Number(quantity) || 1;
  const unitPrice = product.offerPrice || product.price || 0;
  const subtotal = unitPrice * qty;
  const name = product.name_bn || product.name;

  return `হ্যালো সুরক্ষা টিম, আমি ক্যাটালগ থেকে এই প্রোডাক্টটি অর্ডার করতে চাই:
প্রোডাক্ট: ${name}
পরিমাণ: ${toBengaliNumber(qty)} টি
মূল্য: ৳${toBengaliNumber(subtotal)}

আমার নাম: 
মোবাইল নম্বর: 
ডেলিভারি ঠিকানা: `;
};

/**
 * Generates prefilled WhatsApp text for multi-product cart order (Cart Drawer)
 */
export const generateCartOrderMessage = (items, totalAmount) => {
  const formattedItems = items.map((item, index) => {
    const serial = toBengaliNumber(index + 1);
    const name = item.name_bn || item.name;
    const qty = toBengaliNumber(item.quantity);
    const subtotal = toBengaliNumber((item.offerPrice || item.price || 0) * item.quantity);
    return `${serial}. ${name} x ${qty} - ৳${subtotal}`;
  }).join('\n');

  const total = toBengaliNumber(totalAmount);

  return `হ্যালো সুরক্ষা টিম, আমি ক্যাটালগ থেকে নিচের প্রোডাক্টগুলো অর্ডার করতে চাই:
${formattedItems}
-----------------------------
সর্বমোট: ৳${total}

আমার নাম: 
মোবাইল নম্বর: 
ডেলিভারি ঠিকানা: `;
};

/**
 * Generates general support inquiry message
 */
export const generateInquiryMessage = (subject = '') => {
  if (subject) {
    return `হ্যালো সুরক্ষা টিম, আমি "${subject}" সম্পর্কে জানতে চাই।`;
  }
  return `হ্যালো সুরক্ষা টিম, আমি সুরক্ষা ক্যাটালগের প্রোডাক্ট সম্পর্কে কিছু তথ্য জানতে চাই।`;
};
