import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const reviewSchema = new Schema(
  {
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    productDid: { type: String, required: true, trim: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    memberDid: { type: String, required: true, trim: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    description: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    isApproved: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    createdByType: { type: String, enum: ["Member", "User"], default: "Member" },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    updatedByType: { type: String, enum: ["Member", "User"], default: null },
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

// Compound index to ensure a member can only leave one review per product
reviewSchema.index({ productDid: 1, memberDid: 1 }, { unique: true });

export const ReviewModel = mongoose.models.Review || model("Review", reviewSchema);
