import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: false, default: null, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    paymentMethod: { type: String, required: true, trim: true },
    paymentPhone: { type: String, trim: true, default: "" },
    paymentEmail: { type: String, trim: true, lowercase: true, default: "" },
    paymentDate: { type: Date, default: () => new Date() },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    pendingAmount: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ["paid", "partial", "pending", "failed", "n-a", "returned", "active", "cancelled"],
      default: "pending",
    },
    isActive: { type: Boolean, default: true, index: true },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true, default: "" },
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

export const PaymentModel = models.Payment || model("Payment", paymentSchema);
