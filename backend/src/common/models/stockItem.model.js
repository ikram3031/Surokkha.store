import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// Unit-level stock the store actually holds (counted in pieces), separate from the products shown on the website
const stockItemSchema = new Schema(
  {
    shortName: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    name: { type: String, trim: true, default: "", maxlength: 160 },
    unit: { type: String, trim: true, default: "pcs", maxlength: 20 },
    // How the item is bought, e.g. { label: "Packet", unitsPerPack: 10 }
    packs: [
      {
        _id: false,
        label: { type: String, required: true, trim: true, maxlength: 40 },
        unitsPerPack: { type: Number, required: true, min: 1 },
      },
    ],
    quantity: { type: Number, default: 0 },
    avgCost: { type: Number, default: 0, min: 0 },
    lastCost: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true, default: "", maxlength: 500 },
    createdBy: { type: String, default: "system", trim: true },
    updatedBy: { type: String, default: "system", trim: true },
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

stockItemSchema.index({ shortName: 1 }, { unique: true });
stockItemSchema.index({ name: "text", shortName: "text" });

export const StockItemModel = models.StockItem || model("StockItem", stockItemSchema);
