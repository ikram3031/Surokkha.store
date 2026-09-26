import mongoose from "mongoose";

const recentSearchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    searchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

recentSearchSchema.index({ userId: 1, searchedAt: -1 });

export const RecentSearchModel = mongoose.model("RecentSearch", recentSearchSchema);
