import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const billingSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: false, index: true },
    billTypeId: { type: Schema.Types.ObjectId, ref: "BillType", default: null, index: true },
    investorId: { type: Schema.Types.ObjectId, ref: "Investor", default: null, index: true },
    investmentId: { type: Schema.Types.ObjectId, ref: "Investment", default: null, index: true },
    title: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    billingMethod: { type: String, trim: true, default: "manual" },
    // Charge applied for the chosen payment method: one of the method's fees, or a custom one
    paymentFee: {
      name: { type: String, trim: true, default: "" },
      percent: { type: Number, default: 0, min: 0 },
      fixed: { type: Number, default: 0, min: 0 },
      amount: { type: Number, default: 0, min: 0 },
      isCustom: { type: Boolean, default: false },
    },
    billingPhone: { type: String, trim: true, default: "" },
    billingEmail: { type: String, trim: true, lowercase: true, default: "" },
    billingDate: { type: Date, default: () => new Date() },
    dueDate: { type: Date, default: null },
    // Amount entered before the payment-method charge; totalAmount = baseAmount + paymentFee.amount
    baseAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    pendingAmount: { type: Number, required: true, min: 0, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ["paid", "pending", "partial", "returned", "active", "cancelled", "failed"],
      default: "pending",
    },
    notes: { type: String, trim: true, default: "" },
    // Receipts / invoices uploaded with the bill (files live in uploads/docs/bills/<YYMM>/)
    attachments: [
      {
        _id: false,
        name: { type: String, trim: true, default: "" },
        url: { type: String, required: true },
        size: { type: Number, default: 0 },
        mimeType: { type: String, default: "" },
      },
    ],
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
        return ret;
      },
    },
  }
);

export const BillingModel = models.Billing || model("Billing", billingSchema);
