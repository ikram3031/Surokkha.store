import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

export const PRODUCT_EVENT_TYPES = ["view", "add_to_cart", "checkout", "purchase"];

// One row per storefront action on a product (page view, add to cart, reached checkout, purchased).
// Powers the dashboard's product funnel; visitorId is the browser's persistent anonymous id.
const productEventSchema = new Schema(
  {
    productKey: { type: String, required: true, trim: true },
    productName: { type: String, default: "", trim: true },
    eventType: { type: String, enum: PRODUCT_EVENT_TYPES, required: true },
    visitorId: { type: String, default: "", index: true },
    quantity: { type: Number, default: 1 },
    value: { type: Number, default: 0 },
    source: { type: String, default: "direct", trim: true },
    referrer: { type: String, default: "" },
    pageUrl: { type: String, default: "" },
    device: { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
    ipAddress: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

productEventSchema.index({ eventType: 1, productKey: 1, createdAt: -1 });
productEventSchema.index({ productKey: 1, createdAt: -1 });
productEventSchema.index({ createdAt: -1 });
// Raw events are only needed for reporting; keep 90 days, MongoDB removes older rows automatically
productEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const ProductEventModel = models.ProductEvent || model("ProductEvent", productEventSchema);
