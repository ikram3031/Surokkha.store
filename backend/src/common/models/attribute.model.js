import mongoose, { Schema, model } from "mongoose";

const attributeValueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    color: { type: String, default: null, trim: true },
    imageUrl: { type: String, default: null, trim: true },
  },
  { _id: false }
);

const attributeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    values: { type: [attributeValueSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AttributeModel = mongoose.models.Attribute || model("Attribute", attributeSchema);
