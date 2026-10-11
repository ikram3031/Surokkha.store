import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

/**
 * Customer Schema
 * Dedicated collection for storing unified customer profiles, contact info,
 * order statistics, and audit history.
 */
const customerOrderRefSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String, trim: true },
    total: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    orderType: { type: String, default: "standard" },
  },
  { _id: false }
);

const customerSchema = new Schema(
  {
    did: {
      type: String,
      default: () => generateDid(),
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    thana: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    postcode: {
      type: String,
      trim: true,
      default: "",
    },
    history: {
      type: [String],
      default: [],
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOrderAt: {
      type: Date,
      default: null,
    },
    orders: {
      type: [customerOrderRefSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["instore", "custom", "online", "manual", "import"],
      default: "online",
    },
  },
  {
    collection: "customers",
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Virtual for full name
customerSchema.virtual("fullName").get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(" ");
});

// Compound indexes for high-performance searching
customerSchema.index({ phone: 1, email: 1 });
customerSchema.index({ firstName: "text", lastName: "text", address: "text" });

export const CustomerModel = models.Customer || model("Customer", customerSchema);
