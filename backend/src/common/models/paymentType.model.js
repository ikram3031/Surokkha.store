import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const paymentTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["mfs", "bank", "cash", "card", "gateway", "other"],
      default: "mfs",
    },
    provider: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    accountName: { type: String, trim: true, default: "" },
    accountType: { type: String, trim: true, default: "Personal" },
    branchName: { type: String, trim: true, default: "" },
    routingNumber: { type: String, trim: true, default: "" },
    chargePercent: { type: Number, default: 0 },
    chargeFixed: { type: Number, default: 0 },
    // Named charges for this method (e.g. Cash Out 1.85%, Send Money ৳5); each can be a percent, a fixed amount, or both
    fees: [
      {
        _id: false,
        name: { type: String, trim: true, required: true },
        percent: { type: Number, default: 0, min: 0 },
        fixed: { type: Number, default: 0, min: 0 },
      },
    ],
    instructions: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "" },
    qrCode: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDefault: { type: Boolean, default: false },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
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

export const PaymentTypeModel = models.PaymentType || model("PaymentType", paymentTypeSchema);
export const PaymentMethodModel = PaymentTypeModel;
