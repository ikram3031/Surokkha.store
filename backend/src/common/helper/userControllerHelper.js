import { USER_ROLES } from "../models/user.model.js";

// Validate the payload for creating a new user account.
export const validateCreateUserPayload = (payload) => {
  const errors = [];

  if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
    errors.push("name is required");
  }

  if (!payload.email || typeof payload.email !== "string" || !payload.email.trim()) {
    errors.push("email is required");
  }

  if (payload.role && !USER_ROLES.includes(payload.role)) {
    errors.push(`role must be one of: ${USER_ROLES.join(", ")}`);
  }

  return errors;
};

// Validate the payload for updating an existing user account.
export const validateUpdateUserPayload = (payload) => {
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

  if (payload.role && !USER_ROLES.includes(payload.role)) {
    errors.push(`role must be one of: ${USER_ROLES.join(", ")}`);
  }

  if (payload.password && payload.password.length < 6) {
    errors.push("password must be at least 6 characters when provided");
  }

  if (payload.role === "Employee") {
    if (!Array.isArray(payload.assets) || payload.assets.length === 0) {
      errors.push("Employee must be assigned at least one asset");
    } else if (payload.assets.length > 2) {
      errors.push("An employee may have at most 2 assets assigned");
    }
  }

  return errors;
};
