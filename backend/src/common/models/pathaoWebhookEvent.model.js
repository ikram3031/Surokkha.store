import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// Raw Pathao webhook deliveries, kept for audit/debugging and de-duplication (auto-expire after 90 days)
const pathaoWebhookEventSchema = new Schema(
  {
    event: { type: String, trim: true, default: "", index: true },
    consignmentId: { type: String, trim: true, default: null, index: true },
    merchantOrderId: { type: String, trim: true, default: null },
    eventTimestamp: { type: String, trim: true, default: null },
    dedupeKey: { type: String, required: true, unique: true },
    payload: { type: Schema.Types.Mixed, default: null },
    mode: { type: String, enum: ["log", "process"], default: "log" },
    processed: { type: Boolean, default: false },
    result: { type: String, trim: true, default: "" },
    error: { type: String, trim: true, default: "" },
    orderNumber: { type: String, trim: true, default: null },
    receivedAt: { type: Date, default: () => new Date(), expires: 60 * 60 * 24 * 90 },
  },
  {
    collection: "pathao_webhook_events",
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

export const PathaoWebhookEventModel =
  models.PathaoWebhookEvent || model("PathaoWebhookEvent", pathaoWebhookEventSchema);
