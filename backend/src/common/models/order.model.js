import mongoose, { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const orderItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    size: { type: String, trim: true, default: "" },
    concentration: { type: String, trim: true, default: "" },
    productDid: { type: String, trim: true, default: "" },
    productId: { type: String, trim: true, default: "" },
    itemId: { type: String, trim: true, default: "" },
    itemType: { type: String, trim: true, default: "product" }, // 'product' | 'item' | 'custom'
    sku: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
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

// Courier settlement: what the courier charged and what it owes back to the store (separate from customer payment)
const courierSettlementSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["none", "pending", "invoiced", "settled", "disputed"],
      default: "none",
      index: true,
    },
    collectedAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    codFee: { type: Number, default: 0 },
    totalCharge: { type: Number, default: 0 },
    netPayout: { type: Number, default: 0 },
    isEstimated: { type: Boolean, default: true },
    invoiceId: { type: String, default: null, trim: true },
    invoicedAt: { type: Date, default: null },
    settledAt: { type: Date, default: null },
    source: { type: String, default: null, trim: true },
  },
  { _id: false },
);

// Schema defining courier shipment and live tracking details
const courierInfoSchema = new Schema(
  {
    provider: { type: String, default: "pathao", trim: true },
    consignmentId: { type: String, default: null, trim: true, index: true },
    merchantOrderId: { type: String, default: null, trim: true },
    trackingCode: { type: String, default: null, trim: true },
    deliveryFee: { type: Number, default: 0 },
    // Actual fee reported by the courier (webhook/invoice); deliveryFee stays the dispatch-time estimate
    actualDeliveryFee: { type: Number, default: null },
    amountToCollect: { type: Number, default: null },
    lastEventAt: { type: Date, default: null },
    settlement: { type: courierSettlementSchema, default: () => ({}) },
    orderStatus: { type: String, default: null, trim: true },
    orderStatusSlug: { type: String, default: null, trim: true },
    storeId: { type: Number, default: null },
    recipientCityId: { type: Number, default: null },
    recipientZoneId: { type: Number, default: null },
    recipientAreaId: { type: Number, default: null },
    dispatchedAt: { type: Date, default: null },
    itemWeight: { type: Number, default: 0.5 },
    rawResponse: { type: Schema.Types.Mixed, default: null },
    history: { type: [Schema.Types.Mixed], default: [] },
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
      enum: ["pending", "processing", "hold", "shipped", "completed", "cancelled", "fake", "return"],
      default: "pending",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: false, index: true },
    billingInfo: { type: billingInfoSchema, required: true },
    shippingInfo: { type: shippingInfoSchema, required: true },
    paymentMethod: { type: String, required: true, trim: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "partially_paid", "paid", "failed", "cancelled", "canceled", "refunded", "returned", "n-a", "n/a"],
      default: "pending",
      index: true,
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentPhone: { type: String, trim: true, default: "" },
    paymentTransactionId: { type: String, trim: true, default: "" },
    shippingTotalAmount: { type: Number, default: 0, min: 0 },
    discountTotalAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
    // Customer's note from checkout (e.g. preferred delivery time)
    orderNotes: { type: String, trim: true, default: "", maxlength: 1000 },
    orderType: { type: String, enum: ["online", "instore", "custom"], default: "online", index: true },
    siteKey: { type: String, trim: true, default: "store", index: true },
    clientDomain: { type: String, trim: true, default: "surokkha.store" },
    items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "items must contain at least one item"] },
    totals: { type: orderTotalsSchema, required: true },
    courier: { type: courierInfoSchema, default: () => ({}) },
    ipAddress: { type: String, trim: true, default: null, index: true },
    fb_login_id: { type: String, trim: true, default: null, index: true },
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
