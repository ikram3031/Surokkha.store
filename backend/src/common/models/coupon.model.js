import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    discountType: { type: String, required: true, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    active: { type: Boolean, default: true },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    applicableBrands: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

export const CouponModel = mongoose.models.Coupon || model("Coupon", couponSchema);
