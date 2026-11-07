import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// One line per stock change, so the inventory view can show why a quantity went up or down
const stockMovementSchema = new Schema(
  {
    entity: { type: String, enum: ["product", "item", "stockItem"], required: true, index: true },
    refId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, default: "", trim: true },
    type: {
      type: String,
      enum: ["order_deduct", "order_release", "return_restock", "manual_add", "manual_remove", "manual_set", "manual_undo", "edit", "purchase_receive", "purchase_adjust", "purchase_cancel"],
      required: true,
      index: true,
    },
    delta: { type: Number, default: 0 },
    before: { type: Number, default: 0 },
    after: { type: Number, default: 0 },
    orderId: { type: Schema.Types.ObjectId, default: null },
    orderNumber: { type: String, default: "", trim: true },
    // Purchase reference for stock received through Plexivia
    externalRef: { type: String, default: "", trim: true, index: true },
    note: { type: String, default: "", trim: true, maxlength: 300 },
    // Manual changes can be taken back once: the original is marked undone, the undo row points back at it
    undoneAt: { type: Date, default: null },
    undoneBy: { type: String, default: "", trim: true },
    undoOf: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: String, default: "system", trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

stockMovementSchema.index({ createdAt: -1 });

export const StockMovementModel = models.StockMovement || model("StockMovement", stockMovementSchema);
