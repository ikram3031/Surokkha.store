import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true, trim: true, select: false },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, trim: true, default: "Customer" },
    emailOtp: { type: String, trim: true, select: false },
    emailOtpExpiresAt: { type: Date, select: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, select: false },
    passwordReset: { type: Boolean, default: false },
    billingAddress: {
      firstName: { type: String, trim: true, default: '' },
      lastName: { type: String, trim: true, default: '' },
      company: { type: String, trim: true, default: '' },
      address1: { type: String, trim: true, default: '' },
      address2: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postcode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    shippingAddress: {
      firstName: { type: String, trim: true, default: '' },
      lastName: { type: String, trim: true, default: '' },
      company: { type: String, trim: true, default: '' },
      address1: { type: String, trim: true, default: '' },
      address2: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postcode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    },
    orders: {
      type: [
        new Schema(
          {
            did: { type: String, required: true, trim: true },
            value: { type: Number, required: true, min: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    totalOrderAmount: { type: Number, default: 0, min: 0 },
    totalPendingAmount: { type: Number, default: 0, min: 0 },
    totalPaidAmount: { type: Number, default: 0, min: 0 },
    refreshToken: { type: String, trim: true, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
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
        delete ret.refreshToken;
        delete ret.refreshTokenExpiresAt;
        delete ret.emailVerifiedAt;
        return ret;
      },
    },
  },
);

export const MemberModel = models.Member || model("Member", memberSchema);
