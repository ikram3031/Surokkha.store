import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

// Roles that can be assigned; "Marketing-Expert" stays valid only for accounts not yet migrated
export const USER_ROLES = ["Owner", "Admin", "Manager", "Marketing Expert", "Investor", "Accountant"];

const userSchema = new Schema(
  {
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    passwordHash: { type: String, required: false, trim: true, select: false },
    phone: { type: String, required: false, trim: true, index: true, default: "" },
    address: { type: String, trim: true, default: "" },
    avatar: { type: String, trim: true, default: "" },
    preferredName: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    website: { type: String, trim: true, default: "" },
    preferences: {
      timezone: { type: String, trim: true, default: "Asia/Dhaka" },
      weekStart: { type: String, enum: ["saturday", "sunday", "monday"], default: "saturday" },
      language: { type: String, enum: ["en", "bn"], default: "en" },
      timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
      appearance: {
        primaryColor: { type: String, trim: true, default: "" },
        radius: { type: String, trim: true, default: "" },
      },
    },
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          expiresAt: { type: Date, required: true },
        }
      ],
      select: false,
      default: []
    },
    emailOtp: { type: String, trim: true, select: false },
    emailOtpExpiresAt: { type: Date, select: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: true },
    role: { type: String, required: true, enum: [...USER_ROLES, "Marketing-Expert"], default: "Marketing Expert" },
    // Main menus granted on top of the role (keys from common/config/accessGroups.js); only the Owner edits these
    extraMenus: { type: [String], default: [] },
    // Accounts data before this day stays hidden from this user; set when Accounts access is first given
    dataAccessFrom: { type: Date, default: null },
    inviteToken: { type: String, select: false },
    inviteTokenExpiresAt: { type: Date, select: false },
    assets: {
      type: [String],
      default: [],
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    lastLoginIp: { type: String, trim: true, default: "", select: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret._id;
        delete ret.passwordHash;
        delete ret.emailOtp;
        delete ret.emailOtpExpiresAt;
        delete ret.twoFactorSecret;
        delete ret.refreshTokens;
        return ret;
      },
    },
  },
);

export const UserModel = models.User || model("User", userSchema);
