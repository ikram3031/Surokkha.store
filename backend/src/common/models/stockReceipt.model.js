import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// One record per purchase received in Plexivia; `lines` hold the units currently applied to stock
const stockReceiptSchema = new Schema(
  {
    externalRef: { type: String, required: true, trim: true, unique: true, index: true },
    source: { type: String, default: "plexivia", trim: true },
    purchaseNumber: { type: String, default: "", trim: true },
    vendorName: { type: String, default: "", trim: true },
    vendorPhone: { type: String, default: "", trim: true },
    receivedAt: { type: Date, default: null },
    status: { type: String, enum: ["received", "cancelled"], default: "received", index: true },
    lines: [
      {
        _id: false,
        stockItemId: { type: Schema.Types.ObjectId, ref: "StockItem", required: true },
        shortName: { type: String, default: "", trim: true },
        packLabel: { type: String, default: "", trim: true },
        packs: { type: Number, default: 0 },
        unitsPerPack: { type: Number, default: 1 },
        units: { type: Number, default: 0 },
        unitCost: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    ],
    totalUnits: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    version: { type: Number, default: 0 },
    lockedAt: { type: Date, default: null },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false }
);

stockReceiptSchema.index({ createdAt: -1 });

export const StockReceiptModel = models.StockReceipt || model("StockReceipt", stockReceiptSchema);
