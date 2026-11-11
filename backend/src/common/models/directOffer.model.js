import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const directOfferSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    freeDelivery: { type: Boolean, default: false },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    products: [{ type: String, trim: true }],
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

export const DirectOfferModel = mongoose.models.DirectOffer || model("DirectOffer", directOfferSchema);
