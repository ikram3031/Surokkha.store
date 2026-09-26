import mongoose from "mongoose";
import { MemberModel } from "../../common/models/member.model.js";
import { OrderModel } from "../../common/models/order.model.js";
import { hashPassword, comparePassword } from "../../common/utils/password.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../common/config/env.js";
import { logger } from "../../common/config/logger.js";
import { sendOtpEmail } from "../../common/utils/otpDelivery.js";
import {
  sanitizeInfo,
  validateAddressPayload,
  validateMemberPayload,
} from "../../common/helper/memberControllerHelper.js";

const { Types } = mongoose;

const createAccessToken = (member) => {
  return jwt.sign(
    { userId: member.id },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN || "20m" },
  );
};

const createRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

const issueMemberTokens = async (member) => {
  const refreshToken = createRefreshToken();
  const refreshTokenExpiresAt = new Date(
    Date.now() + (env.REFRESH_TOKEN_EXPIRES_MS || 30 * 24 * 60 * 60 * 1000),
  );

  member.refreshToken = refreshToken;
  member.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await member.save();

  return {
    accessToken: createAccessToken(member),
    accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN || "20m",
    refreshToken,
    refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
  };
};

// List members with search, pagination, and optional segment filtering.
export const listMembers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '15', 10));
    
    const filter = {};
    
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    if (req.query.segment && req.query.segment !== 'All') {
      filter.segment = req.query.segment;
    }
    
    const total = await MemberModel.countDocuments(filter);
    const members = await MemberModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const memberIds = members.map((m) => m._id);
    const memberEmails = members.map((m) => m.email).filter(Boolean);

    // Aggregate orders for these members by ObjectId or Email
    const orderAggregates = await OrderModel.aggregate([
      {
        $match: {
          $or: [
            { member: { $in: memberIds } },
            { "billingInfo.email": { $in: memberEmails } },
          ],
          active: { $ne: false },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            memberId: "$member",
            email: { $toLower: "$billingInfo.email" },
          },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ["$totals.total", 0] } },
        },
      },
    ]);

    // Build fast lookup map
    const statsMap = new Map();
    for (const agg of orderAggregates) {
      if (agg._id.memberId) {
        const key = agg._id.memberId.toString();
        const existing = statsMap.get(key) || { totalOrders: 0, totalSpent: 0 };
        statsMap.set(key, {
          totalOrders: existing.totalOrders + agg.totalOrders,
          totalSpent: existing.totalSpent + agg.totalSpent,
        });
      }
      if (agg._id.email) {
        const key = agg._id.email;
        const existing = statsMap.get(key) || { totalOrders: 0, totalSpent: 0 };
        statsMap.set(key, {
          totalOrders: existing.totalOrders + agg.totalOrders,
          totalSpent: existing.totalSpent + agg.totalSpent,
        });
      }
    }

    const enhancedMembers = members.map((m) => {
      const idKey = m._id.toString();
      const emailKey = (m.email || "").toLowerCase();
      const statsById = statsMap.get(idKey);
      const statsByEmail = statsMap.get(emailKey);
      const calculatedStats = statsById || statsByEmail || { totalOrders: (m.orders || []).length, totalSpent: m.totalOrderAmount || 0 };

      return {
        ...m,
        totalOrders: calculatedStats.totalOrders,
        totalOrderAmount: calculatedStats.totalSpent,
        lifetimeSpent: calculatedStats.totalSpent,
      };
    });
      
    res.json({
      status: "success",
      data: enhancedMembers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch one member record by Mongo ObjectId.
export const getMemberById = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid member ID" });
    }

    const member = await MemberModel.findById(memberId).lean();
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    // Fetch member's orders
    const orders = await OrderModel.find({
      $or: [
        { member: member._id },
        { "billingInfo.email": (member.email || "").toLowerCase() },
      ],
      active: { $ne: false },
    })
      .sort({ createdAt: -1 })
      .lean();

    const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");
    const dynamicTotalSpent = nonCancelledOrders.reduce(
      (sum, o) => sum + Number(o.totals?.total || 0),
      0
    );

    res.json({
      status: "success",
      data: {
        ...member,
        totalOrders: orders.length,
        lifetimeSpent: dynamicTotalSpent,
        totalOrderAmount: dynamicTotalSpent,
        orderList: orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a member record after validating the request id.
export const deleteMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid member ID" });
    }

    const member = await MemberModel.findByIdAndDelete(memberId).lean();
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    res.json({ status: "success", message: "Member deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Create a new member and persist its sanitized billing/shipping address data.
export const createMember = async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const validationErrors = validateMemberPayload(
      payload,
      payload.billingInfo,
      payload.shippingInfo,
    );
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid member payload",
        errors: validationErrors,
      });
    }

    const existing = await MemberModel.findOne({
      email: payload.email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "A member with this email already exists",
      });
    }

    const member = await MemberModel.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone.trim(),
      passwordHash: await hashPassword(payload.password),
      billingAddress: sanitizeInfo(payload.billingAddress ?? payload.billingInfo),
      shippingAddress: sanitizeInfo(payload.shippingAddress ?? payload.shippingInfo),
      createdBy: payload.createdBy || req.user?.userId || req.user?.id || null,
    });

    res.status(201).json({ status: "success", data: member });
  } catch (error) {
    next(error);
  }
};

// Update a member profile and persist any valid address changes.
export const updateMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid member ID" });
    }

    const payload = req.body ?? {};
    const updates = {};
    // Fixed typo: was `re.user?._id` — should be `req.user?._id`
    updates.updatedBy = payload.updatedBy || req.user?.userId || req.user?._id || req.user?.did || null;

    if (payload.name) {
      updates.name = payload.name.trim();
    }
    if (payload.email) {
      updates.email = payload.email.toLowerCase().trim();
    }
    if (payload.phone !== undefined) {
      const trimmedPhone = typeof payload.phone === "string" ? payload.phone.trim() : "";
      if (trimmedPhone) {
        if (!/^\+8801[3-9]\d{8}$/.test(trimmedPhone)) {
          return res.status(400).json({
            status: "error",
            message: "phone must be a valid Bangladeshi number in format +8801[3-9]XXXXXXXXX",
          });
        }
        // Check uniqueness excluding the current member being updated
        const existingPhoneMember = await MemberModel.findOne({
          phone: trimmedPhone,
          _id: { $ne: memberId },
        }).lean();
        if (existingPhoneMember) {
          return res.status(409).json({
            status: "error",
            message: "A member with this phone number already exists",
          });
        }
      }
      updates.phone = trimmedPhone;
    }
    if (payload.password) {
      if (typeof payload.password !== "string" || payload.password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "password must be at least 6 characters",
        });
      }
      updates.passwordHash = await hashPassword(payload.password);
    }

    // Accept both billingInfo (legacy frontend key) and billingAddress (model key)
    const billingPayload = payload.billingAddress ?? payload.billingInfo;
    if (billingPayload !== undefined) {
      const billingErrors = validateAddressPayload(billingPayload, "billingAddress");
      if (billingErrors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid billing information",
          errors: billingErrors,
        });
      }
      updates.billingAddress = sanitizeInfo(billingPayload);
    }

    // Accept both shippingInfo (legacy frontend key) and shippingAddress (model key)
    const shippingPayload = payload.shippingAddress ?? payload.shippingInfo;
    if (shippingPayload !== undefined) {
      const shippingErrors = validateAddressPayload(shippingPayload, "shippingAddress");
      if (shippingErrors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid shipping information",
          errors: shippingErrors,
        });
      }
      updates.shippingAddress = sanitizeInfo(shippingPayload);
    }

    const member = await MemberModel.findByIdAndUpdate(memberId, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    res.json({ status: "success", data: member });
  } catch (error) {
    next(error);
  }
};


// Register a new member with automatic verification and instant token issue.
export const registerMember = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body ?? {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedPassword = typeof password === "string" ? password : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedRole = typeof role === "string" ? role.trim() : "";

    const errors = [];
    if (!trimmedName) {
      errors.push("name is required");
    }
    if (!trimmedEmail) {
      errors.push("email is required");
    }
    if (trimmedPhone && !/^\+8801[3-9]\d{8}$/.test(trimmedPhone)) {
      errors.push("phone must be a valid Bangladeshi number in format +8801[3-9]XXXXXXXXX");
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      errors.push("password is required and must be at least 6 characters");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid registration payload",
        errors,
      });
    }

    const existingMember = await MemberModel.findOne({
      email: trimmedEmail,
    });
    if (existingMember) {
      return res.status(409).json({
        status: "error",
        message: "A member with this email already exists",
      });
    }

    if (trimmedPhone) {
      const existingPhoneMember = await MemberModel.findOne({ phone: trimmedPhone }).lean();
      if (existingPhoneMember) {
        return res.status(409).json({
          status: "error",
          message: "A member with this phone number already exists",
        });
      }
    }

    let member;
    try {
      member = await MemberModel.create({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        passwordHash: await hashPassword(trimmedPassword),
        role: trimmedRole || "Customer",
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        billingAddress: sanitizeInfo(req.body?.billingAddress ?? req.body?.billingInfo),
        shippingAddress: sanitizeInfo(req.body?.shippingAddress ?? req.body?.shippingInfo),
      });
    } catch (createError) {
      logger.error({ error: createError, email: trimmedEmail }, "Failed to create member record");
      if (createError.code === 11000) {
        return res.status(409).json({
          status: "error",
          message: "A member with this email or phone number already exists",
        });
      }
      return res.status(500).json({
        status: "error",
        message: createError.message || "Failed to create member account",
      });
    }

    const tokenBundle = await issueMemberTokens(member);

    return res.status(201).json({
      status: "success",
      message: "Registration successful",
      isEmailVerified: true,
      data: {
        user: {
          id: member.id,
          did: member.did,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
        ...tokenBundle,
      },
      ...tokenBundle,
    });
  } catch (error) {
    next(error);
  }
};

// Verify a registration OTP and mark the member email as confirmed.
export const verifyMemberOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedOtp = typeof otp === "string" ? otp.trim() : "";

    if (!trimmedEmail || !trimmedOtp) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and OTP are required" });
    }

    const member = await MemberModel.findOne({
      email: trimmedEmail,
    }).select("+passwordHash +emailOtp +emailOtpExpiresAt");
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    if (
      member.emailOtp !== trimmedOtp ||
      !member.emailOtpExpiresAt ||
      member.emailOtpExpiresAt < new Date()
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
    }

    member.isEmailVerified = true;
    member.emailVerifiedAt = new Date();
    await member.save();

    const tokenBundle = await issueMemberTokens(member);

    return res.json({
      status: "success",
      message: "Verified successfully",
      isEmailVerified: true,
      data: {
        user: {
          id: member.id,
          did: member.did,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
        ...tokenBundle,
      },
      ...tokenBundle,
    });
  } catch (error) {
    next(error);
  }
};

// Rotate a member refresh token and issue a fresh access token pair.
export const refreshMemberToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "refreshToken is required",
      });
    }

    const member = await MemberModel.findOne({ refreshToken }).select(
      "+refreshToken +refreshTokenExpiresAt",
    );
    if (!member || !member.refreshTokenExpiresAt || member.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired refresh token",
      });
    }

    const tokenBundle = await issueMemberTokens(member);

    return res.json({
      status: "success",
      data: {
        ...tokenBundle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clear the stored refresh token so the member session can no longer be rotated.
export const logoutMember = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "refreshToken is required",
      });
    }

    const member = await MemberModel.findOne({ refreshToken }).select(
      "+refreshToken +refreshTokenExpiresAt",
    );
    if (member) {
      member.refreshToken = undefined;
      member.refreshTokenExpiresAt = undefined;
      await member.save();
    }

    return res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Check if member email exists and is verified.
export const checkMemberEmail = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail) {
      return res.status(400).json({ status: "error", message: "Email is required" });
    }

    const member = await MemberModel.findOne({ email: normalizedEmail });
    if (!member) {
      return res.status(404).json({ status: "error", message: "No member account found with this email" });
    }

    return res.status(200).json({
      status: "success",
      requiresOtp: false,
      isEmailVerified: true,
      message: "Email is verified. Please enter your password.",
      data: {
        email: member.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Authenticate a member and issue new access and refresh tokens.
export const loginMember = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and password are required" });
    }

    const member = await MemberModel.findOne({ email: normalizedEmail }).select(
      "+passwordHash",
    );
    if (!member) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    if (!member.passwordHash) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(
      password,
      member.passwordHash,
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    if (!member.isEmailVerified) {
      member.isEmailVerified = true;
      member.emailVerifiedAt = new Date();
      member.emailOtp = undefined;
      member.emailOtpExpiresAt = undefined;
      await member.save();
    }

    const tokenBundle = await issueMemberTokens(member);

    res.json({
      status: "success",
      isEmailVerified: true,
      data: {
        user: {
          id: member.id,
          did: member.did,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
        ...tokenBundle,
      },
      ...tokenBundle,
    });
  } catch (error) {
    next(error);
  }
};

// Resend a fresh member verification OTP.
export const resendMemberOtp = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!trimmedEmail) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const member = await MemberModel.findOne({ email: trimmedEmail });
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "No member found with this email" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    member.emailOtp = otp;
    member.emailOtpExpiresAt = otpExpires;
    member.isEmailVerified = true;
    member.emailVerifiedAt = new Date();
    await member.save();

    res.json({
      status: "success",
      message: "Your account is verified and active.",
      data: {
        email: member.email,
        expiresAt: otpExpires.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change a member password directly after validating the supplied new password.
export const changeMemberPassword = async (req, res, next) => {
  try {
    const { memberId } = req.params ?? {};
    const { newPassword } = req.body ?? {};
    const trimmedPassword = typeof newPassword === "string" ? newPassword : "";

    if (!memberId) {
      return res.status(400).json({
        status: "error",
        message: "Member id is required",
      });
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }

    const member = await MemberModel.findById(memberId).select("+passwordHash");
    if (!member) {
      return res.status(404).json({
        status: "error",
        message: "Member not found",
      });
    }

    member.passwordHash = await hashPassword(trimmedPassword);
    await member.save();

    return res.json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Send a password reset OTP when a member requests a forgotten-password flow.
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!trimmedEmail) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const member = await MemberModel.findOne({ email: trimmedEmail }).select(
      "+emailOtp +emailOtpExpiresAt",
    );
    if (!member) {
      // Don't reveal whether the email exists — security best practice
      return res.json({
        status: "success",
        message:
          "If an account with this email exists, a password reset OTP has been sent.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    member.emailOtp = otp;
    member.emailOtpExpiresAt = otpExpires;
    await member.save();

    const emailResult = await sendOtpEmail({
      toEmail: member.email,
      otp,
      name: member.name,
      type: "forgot-password",
    });

    if (!emailResult.delivered) {
      logger.error(
        { email: trimmedEmail, reason: emailResult.reason },
        "Failed to send password reset OTP email",
      );
      return res.status(500).json({
        status: "error",
        message: emailResult.reason || "Failed to send password reset email",
      });
    }

    console.log(`Generated forgot-password OTP for ${trimmedEmail}: ${otp}`);

    return res.json({
      status: "success",
      message:
        "If an account with this email exists, a password reset OTP has been sent.",
      data: {
        email: member.email,
        expiresAt: otpExpires.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify the reset OTP and update the member password to the new value.
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedOtp = typeof otp === "string" ? otp.trim() : "";
    const trimmedPassword = typeof password === "string" ? password : "";

    if (!trimmedEmail || !trimmedOtp || !trimmedPassword) {
      return res.status(400).json({
        status: "error",
        message: "Email, otp, and new password are required",
      });
    }
    if (trimmedPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }

    const member = await MemberModel.findOne({
      email: trimmedEmail,
      emailOtp: trimmedOtp,
    }).select("+emailOtp +emailOtpExpiresAt +passwordHash");
    if (
      !member ||
      !member.emailOtpExpiresAt ||
      member.emailOtpExpiresAt < new Date()
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
    }

    member.passwordHash = await hashPassword(trimmedPassword);
    member.emailOtp = undefined;
    member.emailOtpExpiresAt = undefined;
    member.isEmailVerified = true;
    member.emailVerifiedAt = new Date();

    const tokenBundle = await issueMemberTokens(member);

    return res.json({
      status: "success",
      isEmailVerified: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
      data: {
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
        ...tokenBundle,
      },
    });
  } catch (error) {
    next(error);
  }
};
