import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import multer from "multer";
import sharp from "sharp";
import mongoose from "mongoose";
import { UserModel } from "../../common/models/user.model.js";
import { AssetModel } from "../../common/models/asset.model.js";
import { hashPassword } from "../../common/utils/password.js";
import { env } from "../../common/config/env.js";
import { config as clientConfig } from "../../common/config/index.js";
import { renderUserInviteEmail } from "../../common/templates/userInviteEmailTemplate.js";
import {
  validateCreateUserPayload,
  validateUpdateUserPayload,
  validateResetPasswordPayload,
} from "../../common/helper/userControllerHelper.js";
import { LogModel } from "../../common/models/log.model.js";
import { getSmtpTransport } from "../../common/services/smtpConfig.service.js";
import { sendPasswordChangedEmail } from "../../common/utils/otpDelivery.js";

// Dispatches user invitation email via active SMTP configuration
export const sendInvitationEmail = async ({ user, inviteUrl }) => {
  try {
    const { transport, config: smtpConfig } = await getSmtpTransport();
    if (!smtpConfig.isConfigured) {
      console.warn(`[UsersController] Cannot send invitation email to ${user.email}: SMTP is not configured in DB or .env`);
      return { success: false, reason: "SMTP credentials not configured" };
    }

    const brandName = smtpConfig.fromName || clientConfig?.brandName || env.SMTP_FROM_NAME || "Surokkha";
    const logoUrl = clientConfig?.logoUrl || "https://admin.surokkha.store/surokkha_logo.png";
    const fromEmail = smtpConfig.fromEmail || smtpConfig.user || env.SMTP_FROM || `noreply@${clientConfig?.domain || "surokkha.store"}`;
    const fromAddress = `"${brandName}" <${fromEmail}>`;

    const info = await transport.sendMail({
      from: fromAddress,
      to: user.email,
      subject: `You're invited to join ${brandName} as ${user.role}`,
      html: renderUserInviteEmail({
        name: user.name,
        role: user.role,
        inviteUrl,
        brandName,
        logoUrl,
      }),
    });
    console.log(`[UsersController] Invitation email successfully dispatched to ${user.email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[UsersController] Failed to send invitation email to ${user.email}:`, err);
    return { success: false, error: err.message };
  }
};

// List all users in the system
export const listUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find().lean();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

// Fetch a single user record by id
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId).lean();
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

// Create a new user and send invitation with role-aware permission checks
export const createUser = async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const validationErrors = validateCreateUserPayload(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({ status: "error", message: "Invalid user payload", errors: validationErrors });
    }

    const creatorRole = req.user?.role || null;
    if (creatorRole === "Admin" && (payload.role === "Owner" || payload.role === "Admin")) {
      return res.status(403).json({ status: "error", message: "Insufficient permissions to create this role" });
    }

    const email = payload.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email });
    if (existing) {
      if (existing.isActive) {
        return res.status(409).json({ status: "error", message: "A user with this email already exists" });
      }
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    let passwordHash = null;
    if (payload.password && payload.password.trim()) {
      passwordHash = await hashPassword(payload.password.trim());
    }

    let user;
    if (existing && !existing.isActive) {
      existing.name = payload.name.trim();
      existing.role = payload.role || existing.role;
      existing.inviteToken = inviteToken;
      existing.inviteTokenExpiresAt = inviteTokenExpiresAt;
      if (passwordHash) existing.passwordHash = passwordHash;
      if (payload.receiveEmailNotifications !== undefined) existing.receiveEmailNotifications = Boolean(payload.receiveEmailNotifications);
      await existing.save();
      user = existing;
    } else {
      user = await UserModel.create({
        name: payload.name.trim(),
        email,
        phone: payload.phone ? payload.phone.trim() : "",
        role: payload.role || "Marketing Expert",
        passwordHash,
        inviteToken,
        inviteTokenExpiresAt,
        isActive: Boolean(passwordHash),
        receiveEmailNotifications: payload.receiveEmailNotifications !== undefined ? Boolean(payload.receiveEmailNotifications) : true,
        createdBy: mongoose.isValidObjectId(req.user?.userId) ? req.user.userId : null,
      });
    }

    const origin = req.headers.origin || req.headers.referer || "";
    let domainUrl = clientConfig?.dashboardUrl || "https://admin.surokkha.store";
    if (payload.domain) {
      domainUrl = payload.domain.startsWith("http") ? payload.domain : `https://${payload.domain}`;
    } else if (origin) {
      try {
        domainUrl = new URL(origin).origin;
      } catch (_) {}
    }
    const inviteUrl = `${domainUrl.replace(/\/$/, "")}/invite?token=${inviteToken}`;

    const mailResult = await sendInvitationEmail({ user, inviteUrl });

    try {
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      await LogModel.create({
        type: "created",
        typeDid: "110",
        description: `${actorName} created system user ${user.name} (${user.email}) with role ${user.role}.`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.error("Failed to create log for user create:", logErr);
    }

    res.status(201).json({
      status: "success",
      message: mailResult.success
        ? "User invited successfully. Invitation link sent via email."
        : "User invited successfully. (Note: Email delivery failed or SMTP not configured; share invite link manually).",
      data: user,
      inviteUrl,
      emailSent: mailResult.success,
      emailError: mailResult.error || (mailResult.success ? null : mailResult.reason),
    });
  } catch (error) {
    next(error);
  }
};

// Resend invitation email for a pending user
export const resendInvitation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ status: "error", message: "This user account is already active" });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    user.inviteToken = inviteToken;
    user.inviteTokenExpiresAt = inviteTokenExpiresAt;
    await user.save();

    const origin = req.headers.origin || req.headers.referer || "";
    let domainUrl = clientConfig?.dashboardUrl || "https://admin.surokkha.store";
    if (req.body?.domain) {
      domainUrl = req.body.domain.startsWith("http") ? req.body.domain : `https://${req.body.domain}`;
    } else if (origin) {
      try {
        domainUrl = new URL(origin).origin;
      } catch (_) {}
    }
    const inviteUrl = `${domainUrl.replace(/\/$/, "")}/invite?token=${inviteToken}`;

    const mailResult = await sendInvitationEmail({ user, inviteUrl });

    return res.json({
      status: "success",
      message: mailResult.success
        ? "Invitation email resent successfully."
        : "Invitation link refreshed, but email delivery failed. You can share the invitation link manually.",
      data: user,
      inviteUrl,
      emailSent: mailResult.success,
      emailError: mailResult.error || (mailResult.success ? null : mailResult.reason),
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing user while enforcing role-based restrictions
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const payload = req.body ?? {};
    const validationErrors = validateUpdateUserPayload(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({ status: "error", message: "Invalid user payload", errors: validationErrors });
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    const updaterRole = req.user?.role || null;
    if (updaterRole === "Admin" && user.role === "Owner") {
      return res.status(403).json({ status: "error", message: "Insufficient permissions to modify this user" });
    }

    if (payload.email && payload.email.toLowerCase().trim() !== user.email) {
      const emailExists = await UserModel.findOne({ email: payload.email.toLowerCase().trim() });
      if (emailExists) return res.status(409).json({ status: "error", message: "A user with this email already exists" });
    }

    if (payload.name !== undefined) user.name = payload.name.trim();
    if (payload.email !== undefined) user.email = payload.email.toLowerCase().trim();
    if (payload.phone !== undefined) user.phone = payload.phone.trim();
    if (payload.role !== undefined) user.role = payload.role;
    if (payload.isActive !== undefined) user.isActive = Boolean(payload.isActive);
    if (payload.receiveEmailNotifications !== undefined) user.receiveEmailNotifications = Boolean(payload.receiveEmailNotifications);

    if (payload.password) {
      user.passwordHash = await hashPassword(payload.password);
    }

    if (payload.role === "Employee" && payload.assets) {
      const assignedAssets = Array.isArray(payload.assets) ? payload.assets : [];
      if (assignedAssets.length > 2) {
        return res.status(400).json({ status: "error", message: "An employee may have at most 2 assets assigned" });
      }
      const found = await AssetModel.find({ did: { $in: assignedAssets } }).lean();
      if (found.length !== assignedAssets.length) {
        return res.status(400).json({ status: "error", message: "One or more assigned assets not found" });
      }
      user.assets = assignedAssets;
    }

    await user.save();

    try {
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      await LogModel.create({
        type: "updated",
        typeDid: "121",
        description: `${actorName} updated system user ${user.name} (${user.email}).`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.error("Failed to create log for user update:", logErr);
    }

    res.json({ status: "success", data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// Delete a user and prevent unsafe admin or self-deletion cases
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?.userId;
    const requesterRole = req.user?.role;

    const user = await UserModel.findById(userId).lean();
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    if (requesterRole === "Admin" && requesterId === String(user._id)) {
      return res.status(403).json({ status: "error", message: "Admin cannot delete own account" });
    }

    if (requesterRole === "Admin" && user.role === "Owner") {
      return res.status(403).json({ status: "error", message: "Insufficient permissions to delete this user" });
    }

    await UserModel.findByIdAndDelete(userId);

    try {
      const actorDid = req.user?.did || "staff";
      const actorName = req.user?.name || "System Admin";
      await LogModel.create({
        type: "deleted",
        typeDid: "666",
        description: `${actorName} deleted system user ${user.name} (${user.email}).`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.error("Failed to create log for user delete:", logErr);
    }

    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Fetch current user's profile
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });
    const user = await UserModel.findById(userId).lean();
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
};

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const PROFILE_WEEK_STARTS = ["saturday", "sunday", "monday"];
const PROFILE_LANGUAGES = ["en", "bn"];
const PROFILE_TIME_FORMATS = ["12h", "24h"];

// Accepts a single "avatar" image up to 10MB, kept in memory for resizing
export const avatarUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)),
}).single("avatar");

// Saves the current user's avatar as a 256px square webp and stores its URL on the profile
export const uploadProfileAvatar = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ status: "error", message: "Upload a PNG, JPEG, GIF or WebP image." });

    const destinationDir = path.join(process.cwd(), "uploads", "avatars");
    fs.mkdirSync(destinationDir, { recursive: true });
    const filename = `${userId}-${Date.now()}.webp`;
    await sharp(req.file.buffer)
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 88 })
      .toFile(path.join(destinationDir, filename));

    const avatarUrl = `/uploads/avatars/${filename}`;
    const user = await UserModel.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true });
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    res.json({ status: "success", data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// Update current user's profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const payload = req.body ?? {};
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    if (payload.firstName !== undefined) user.firstName = payload.firstName.trim();
    if (payload.lastName !== undefined) user.lastName = payload.lastName.trim();
    if (payload.firstName || payload.lastName) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    
    if (payload.phone !== undefined) user.phone = String(payload.phone).trim();
    if (payload.address !== undefined) user.address = String(payload.address).trim();
    if (payload.avatar !== undefined) user.avatar = String(payload.avatar).trim();
    if (payload.preferredName !== undefined) user.preferredName = String(payload.preferredName).trim();
    if (payload.website !== undefined) user.website = String(payload.website).trim();
    if (payload.receiveEmailNotifications !== undefined) user.receiveEmailNotifications = Boolean(payload.receiveEmailNotifications);

    if (payload.username !== undefined) {
      const username = String(payload.username).trim().toLowerCase();
      if (username && !USERNAME_PATTERN.test(username)) {
        return res.status(400).json({ status: "error", message: "Username can use 3-30 letters, numbers, dots, dashes or underscores." });
      }
      if (username) {
        const taken = await UserModel.exists({ username, _id: { $ne: user._id } });
        if (taken) return res.status(409).json({ status: "error", message: "That username is already taken." });
      }
      user.username = username || undefined;
    }

    if (payload.preferences && typeof payload.preferences === "object") {
      const prefs = payload.preferences;
      const current = user.preferences?.toObject?.() || user.preferences || {};
      user.preferences = {
        ...current,
        ...(prefs.timezone !== undefined ? { timezone: String(prefs.timezone).trim() || "Asia/Dhaka" } : {}),
        ...(PROFILE_WEEK_STARTS.includes(prefs.weekStart) ? { weekStart: prefs.weekStart } : {}),
        ...(PROFILE_LANGUAGES.includes(prefs.language) ? { language: prefs.language } : {}),
        ...(PROFILE_TIME_FORMATS.includes(prefs.timeFormat) ? { timeFormat: prefs.timeFormat } : {}),
      };
    }

    await user.save();

    res.json({ status: "success", data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset a system user's password (Owner or Admin action)
 */
export const resetUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const payload = req.body ?? {};

    const validationErrors = validateResetPasswordPayload(payload);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: validationErrors.join(", "),
        errors: validationErrors,
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    const requesterRole = req.user?.role || "";
    // Owner protection: Admin cannot reset an Owner's password
    if (requesterRole === "Admin" && user.role === "Owner") {
      return res.status(403).json({
        status: "error",
        message: "Insufficient permissions: Administrators cannot reset an Owner's password.",
      });
    }

    const passwordHash = await hashPassword(payload.password.trim());
    user.passwordHash = passwordHash;
    user.isActive = true;
    user.inviteToken = null;
    user.inviteTokenExpiresAt = null;
    await user.save();

    // Let the staff member know their password was reset (fire-and-forget)
    sendPasswordChangedEmail({ toEmail: user.email, name: user.name, byAdmin: true });

    // Log the password reset activity
    try {
      const actorName = req.user?.name || req.user?.email || "Admin";
      const actorDid = req.user?.did || req.user?.userId || "system";
      await LogModel.create({
        type: "user",
        typeDid: user.did || user.id || "user",
        description: `${actorName} reset the password for system user ${user.name} (${user.email}).`,
        readStatus: false,
        active: true,
        createdBy: actorDid,
        updatedBy: actorDid,
      });
    } catch (logErr) {
      console.warn("Failed to create log for password reset:", logErr);
    }

    return res.json({
      status: "success",
      message: `Password for ${user.name} has been reset successfully.`,
      data: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
