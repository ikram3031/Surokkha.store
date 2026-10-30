import mongoose, { Schema, model } from "mongoose";

const seoNotFoundSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, unique: true, index: true },
    referrer: { type: String, trim: true, default: "" },
    hits: { type: Number, default: 1, min: 0 },
    lastSeenAt: { type: Date, default: Date.now, index: true },
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

export const SeoNotFoundModel = mongoose.models.SeoNotFound || model("SeoNotFound", seoNotFoundSchema);
