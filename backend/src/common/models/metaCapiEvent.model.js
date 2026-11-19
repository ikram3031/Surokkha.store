import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// One row per order-level Meta Conversions API event (Purchase, ConfirmedOrder): what was sent, where, and how it went
const metaCapiEventSchema = new Schema(
  {
    eventName: { type: String, required: true, trim: true, index: true },
    eventId: { type: String, required: true, trim: true, index: true },
    orderNumber: { type: String, default: "", trim: true, index: true },
    site: { type: String, enum: ["store", "shop"], default: "shop", index: true },
    pixelId: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "sent", "failed", "skipped"], default: "pending", index: true },
    retryable: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    httpStatus: { type: Number, default: null },
    lastError: { type: String, default: "" },
    skipReason: { type: String, default: "" },
    requestBody: { type: Schema.Types.Mixed, default: null },
    metaResponse: { type: Schema.Types.Mixed, default: null },
    nextRetryAt: { type: Date, default: null, index: true },
    sentAt: { type: Date, default: null },
    alertedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

metaCapiEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

export const MetaCapiEventModel = models.MetaCapiEvent || model("MetaCapiEvent", metaCapiEventSchema);
