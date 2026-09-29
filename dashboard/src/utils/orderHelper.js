export const effectivePrice = (price, offerPrice) =>
  offerPrice != null && offerPrice > 0 && offerPrice < price ? offerPrice : price;

export const formatBDT = (amount) => `৳${amount.toLocaleString("en-BD")}`;
