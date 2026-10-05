import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    phone: { type: String, trim: true, default: "" },
    names: { type: [String], default: [] },
    phones: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    orderProfiles: {
      type: [
        new Schema(
          {
            name: { type: String, trim: true },
            phone: { type: String, trim: true },
            email: { type: String, trim: true, lowercase: true },
            address: { type: String, trim: true },
            thana: { type: String, trim: true },
            district: { type: String, trim: true },
            ipAddress: { type: String, trim: true },
            orderId: { type: Schema.Types.ObjectId, ref: "Order" },
            orderNumber: { type: String },
            recordedAt: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
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
    gender: { type: String, trim: true, lowercase: true, default: null }, // "m" or "f" — used for Meta CAPI ge parameter
    dob: { type: Date, default: null }, // Date of birth — used for Meta CAPI db parameter (YYYYMMDD)
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
        delete ret.refreshTokens;
        delete ret.emailVerifiedAt;
        return ret;
      },
    },
  },
);

export const MemberModel = models.Member || model("Member", memberSchema);
