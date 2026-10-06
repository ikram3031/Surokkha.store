/**
 * Number and currency formatting utilities for Surokkha Catalog
 */

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const toBengaliNumber = (num) => {
  if (num === null || num === undefined) return '';
  return String(num).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
};

export const formatPrice = (price) => {
  if (price === null || price === undefined) return '৳০';
  const formatted = Number(price).toLocaleString('en-IN');
  return `৳${toBengaliNumber(formatted)}`;
};

export const calculateDiscount = (regularPrice, offerPrice) => {
  if (!regularPrice || !offerPrice || regularPrice <= offerPrice) return 0;
  return Math.round(((regularPrice - offerPrice) / regularPrice) * 100);
};
