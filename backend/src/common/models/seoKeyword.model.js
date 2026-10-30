import mongoose, { Schema, model } from "mongoose";

const seoKeywordSchema = new Schema(
  {
    keyword: { type: String, required: true, trim: true, lowercase: true, unique: true },
    page: { type: String, trim: true, default: "" },
    position: { type: Number, default: 0, min: 0 },
    previousPosition: { type: Number, default: 0, min: 0 },
    volume: { type: Number, default: 0, min: 0 },
    trend: [{ type: Number }],
    country: { type: String, trim: true, default: "BD" },
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

export const SeoKeywordModel = mongoose.models.SeoKeyword || model("SeoKeyword", seoKeywordSchema);
