import mongoose, { Schema, model } from "mongoose";

const blogViewDailySchema = new Schema(
  {
    day: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { versionKey: false }
);

export const BlogViewDailyModel = mongoose.models.BlogViewDaily || model("BlogViewDaily", blogViewDailySchema);
