import mongoose, { Schema, model } from "mongoose";

const sizeChartRowSchema = new Schema(
  {
    size: { type: String, required: true, trim: true },
    values: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const sizeChartSchema = new Schema(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      unique: true,
      index: true,
    },
    categorySlug: { type: String, trim: true, index: true },
    categoryDid: { type: String, trim: true, index: true },
    attributeId: {
      type: Schema.Types.ObjectId,
      ref: "Attribute",
      default: null,
    },
    attributeName: { type: String, default: "Size", trim: true },
    columns: [{ type: String, trim: true }],
    rows: [sizeChartRowSchema],
    unit: { type: String, default: "inches", trim: true },
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

export const SizeChartModel =
  mongoose.models.SizeChart || model("SizeChart", sizeChartSchema);
