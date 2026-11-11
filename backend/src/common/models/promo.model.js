import mongoose, { Schema, model } from "mongoose";

// Single document: the dashboard "Promo" page (promotional banner + preset offers)
const promoSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true },
    banner: {
      isActive: { type: Boolean, default: false },
      imageUrl: { type: String, trim: true, default: "" },
      text: { type: String, trim: true, default: "" },
      link: { type: String, trim: true, default: "" },
    },
    // Preset: a newly registered (email-verified) customer's first order ships free above a minimum amount
    newUserFreeDelivery: {
      isActive: { type: Boolean, default: false },
      minOrderAmount: { type: Number, default: 500, min: 0 },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

export const PromoModel = mongoose.models.Promo || model("Promo", promoSchema);
