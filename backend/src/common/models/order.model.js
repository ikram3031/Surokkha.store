import mongoose, { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const orderItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    size: { type: String, trim: true },
    concentration: { type: String, trim: true },
    productDid: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

// Schema defining customer billing contact and location details
const billingInfoSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: false, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    thana: { type: String, trim: true, default: '' },
    district: { type: String, required: true, trim: true },
    zip: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

// Schema defining recipient shipping contact and location details
const shippingInfoSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    thana: { type: String, trim: true, default: '' },
    district: { type: String, required: true, trim: true },
    zip: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

// Schema defining checkout order totals
const orderTotalsSchema = new Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

// Unified Order schema for transaction tracking
const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    status: {
      type: String,
      required: true,
      enum: [ "processing", "shipped", "completed", "cancelled"],
      default: "processing",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    member: { type: Schema.Types.ObjectId, ref: "Member", required: false },
    billingInfo: { type: billingInfoSchema, required: true },
    shippingInfo: { type: shippingInfoSchema, required: true },
    paymentMethod: { type: String, required: true, trim: true },
    shippingTotalAmount: { type: Number, default: 0, min: 0 },
    discountTotalAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
    orderType: { type: String, enum: ["online", "instore"], default: "online", index: true },
    items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "items must contain at least one item"] },
    totals: { type: orderTotalsSchema, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    collection: "orders",
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret._id;
        return ret;
      },
    },
  },
);

export const OrderModel = models.Order || model("Order", orderSchema);
