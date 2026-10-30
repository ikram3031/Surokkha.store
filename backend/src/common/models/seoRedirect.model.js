import mongoose, { Schema, model } from "mongoose";

const seoRedirectSchema = new Schema(
  {
    from: { type: String, required: true, trim: true, unique: true, index: true },
    to: { type: String, trim: true, default: "" },
    type: { type: Number, enum: [301, 302, 410], default: 301 },
    active: { type: Boolean, default: true, index: true },
    hits: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
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

export const SeoRedirectModel = mongoose.models.SeoRedirect || model("SeoRedirect", seoRedirectSchema);
