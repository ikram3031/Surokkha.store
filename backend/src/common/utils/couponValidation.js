export function validateCouponPayload(payload = {}) {
  const errors = [];
  const normalized = {
    code: typeof payload.code === "string" ? payload.code.trim().toUpperCase() : "",
    discountType: typeof payload.discountType === "string" ? payload.discountType.trim().toLowerCase() : "",
    discountValue: Number(payload.discountValue),
    minOrderAmount: Number(payload.minOrderAmount ?? 0),
    validFrom: payload.validFrom ?? null,
    validTo: payload.validTo ?? null,
    active: payload.active !== false,
    applicableProducts: Array.isArray(payload.applicableProducts) ? payload.applicableProducts.filter(Boolean) : [],
    applicableCategories: Array.isArray(payload.applicableCategories) ? payload.applicableCategories.filter(Boolean) : [],
    applicableBrands: Array.isArray(payload.applicableBrands) ? payload.applicableBrands.filter(Boolean) : [],
    usageLimit: payload.usageLimit !== undefined && payload.usageLimit !== null && payload.usageLimit !== "" ? Number(payload.usageLimit) : null,
  };

  if (normalized.usageLimit !== null && (Number.isNaN(normalized.usageLimit) || normalized.usageLimit <= 0)) {
    errors.push("usageLimit must be a positive number if set");
  }

  if (!normalized.code) {
    errors.push("code is required");
  }

  if (!["percentage", "fixed"].includes(normalized.discountType)) {
    errors.push("discountType must be either percentage or fixed");
  }

  if (!Number.isFinite(normalized.discountValue) || normalized.discountValue <= 0) {
    errors.push("discountValue must be a positive number");
  }

  if (normalized.discountType === "percentage" && normalized.discountValue > 100) {
    errors.push("percentage discount cannot exceed 100");
  }

  if (normalized.minOrderAmount < 0) {
    errors.push("minOrderAmount cannot be negative");
  }

  if (normalized.validFrom && Number.isNaN(Date.parse(normalized.validFrom))) {
    errors.push("validFrom must be a valid date");
  }

  if (normalized.validTo && Number.isNaN(Date.parse(normalized.validTo))) {
    errors.push("validTo must be a valid date");
  }

  if (normalized.validFrom && normalized.validTo && new Date(normalized.validTo) < new Date(normalized.validFrom)) {
    errors.push("validTo cannot be earlier than validFrom");
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}
