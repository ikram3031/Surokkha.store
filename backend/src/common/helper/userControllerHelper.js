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

  if (payload.name !== undefined && (typeof payload.name !== "string" || !payload.name.trim())) {
    errors.push("name cannot be empty");
  }

  if (payload.email !== undefined && (typeof payload.email !== "string" || !payload.email.trim())) {
    errors.push("email cannot be empty");
  }

  if (payload.phone !== undefined && typeof payload.phone !== "string") {
    errors.push("phone must be a string");
  }

  if (payload.role && !USER_ROLES.includes(payload.role)) {
    errors.push(`role must be one of: ${USER_ROLES.join(", ")}`);
  }

  if (payload.password && (typeof payload.password !== "string" || payload.password.length < 6)) {
    errors.push("password must be at least 6 characters when provided");
  }

  if (payload.role === "Employee") {
    if (payload.assets !== undefined) {
      if (!Array.isArray(payload.assets) || payload.assets.length === 0) {
        errors.push("Employee must be assigned at least one asset");
      } else if (payload.assets.length > 2) {
        errors.push("An employee may have at most 2 assets assigned");
      }
    }
  }

  return errors;
};

// Validate the payload for resetting a user's password.
export const validateResetPasswordPayload = (payload) => {
  const errors = [];

  if (!payload.password || typeof payload.password !== "string" || payload.password.trim().length < 6) {
    errors.push("password is required and must be at least 6 characters");
  }

  if (payload.confirmPassword !== undefined && payload.password !== payload.confirmPassword) {
    errors.push("confirmPassword does not match password");
  }

  return errors;
};
