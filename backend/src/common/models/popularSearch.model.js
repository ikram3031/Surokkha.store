import mongoose from "mongoose";

const popularSearchSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

popularSearchSchema.index({ count: -1 });

export const PopularSearchModel = mongoose.model("PopularSearch", popularSearchSchema);
