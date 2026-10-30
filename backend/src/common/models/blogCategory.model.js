import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const blogCategorySchema = new Schema(
  {
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true, default: "" },
    seoTitle: { type: String, trim: true, default: "" },
    parent: { type: Schema.Types.ObjectId, ref: "BlogCategory", default: null },
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

export const BlogCategoryModel = mongoose.models.BlogCategory || model("BlogCategory", blogCategorySchema);
