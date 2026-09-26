// Helper validators and sanitizers for member controller request payloads.
const hasAddressData = (address) => {
  if (!address || typeof address !== "object") return false;

  return Object.entries(address).some(([key, value]) => {
    if (key === "company" || key === "address2") return false;
    if (typeof value === "string") return value.trim() !== "";
    return value !== undefined && value !== null;
  });
};

// Validate a billing or shipping address object against the required schema.
export const validateAddressPayload = (address, sectionName) => {
  const errors = [];
  const requiredFields = [
    "firstName",
    "lastName",
    "address1",
    "district",
    "city",
    "state",
    "postcode",
    "country",
    "email",
    "phone",
  ];

  if (!address || typeof address !== "object") {
    return [];
  }

  if (!hasAddressData(address)) {
    return [];
  }

  requiredFields.forEach((field) => {
    const value = address[field];
    if (!value || typeof value !== "string" || !value.trim()) {
      errors.push(`${sectionName}.${field} is required`);
    }
  });

  return errors;
};

// Validate the full member payload, including address sections when provided.
export const validateMemberPayload = (payload, billingInfo, shippingInfo) => {
  const errors = [];
  if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
    errors.push("name is required");
  }
  if (!payload.email || typeof payload.email !== "string" || !payload.email.trim()) {
    errors.push("email is required");
  }
  if (!payload.phone || typeof payload.phone !== "string" || !payload.phone.trim()) {
    errors.push("phone is required");
  }
  if (!payload.password || typeof payload.password !== "string" || payload.password.length < 6) {
    errors.push("password is required and must be at least 6 characters");
  }

  if (payload.billingInfo !== undefined) {
    errors.push(...validateAddressPayload(billingInfo, "billingInfo"));
  }
  if (payload.shippingInfo !== undefined) {
    errors.push(...validateAddressPayload(shippingInfo, "shippingInfo"));
  }

  return errors;
};

// Normalize an address object by trimming string fields and removing nullish values.
export const sanitizeInfo = (info) => {
  if (!info || typeof info !== "object") return {};
  return Object.entries(info).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    acc[key] = typeof value === "string" ? value.trim() : value;
    return acc;
  }, {});
};
