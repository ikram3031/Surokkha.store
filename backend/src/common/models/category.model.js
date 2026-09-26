import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";


const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    description: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    productCount: { type: Number, default: 0, min: 0 },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
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

export const CategoryModel = mongoose.models.Category || model("Category", categorySchema);
