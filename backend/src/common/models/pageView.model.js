import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// One row per storefront page opened (product and checkout pages excluded, they are counted in the product funnel).
// landing marks the first page of a visit, so the dashboard can show where visitors enter the site.
const pageViewSchema = new Schema(
  {
    site: { type: String, enum: ["shop", "store"], default: "shop" },
    path: { type: String, required: true, trim: true },
    pageType: { type: String, default: "other", trim: true },
    title: { type: String, default: "", trim: true },
    visitorId: { type: String, default: "", index: true },
    landing: { type: Boolean, default: false },
    source: { type: String, default: "direct", trim: true },
    referrer: { type: String, default: "" },
    device: { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
    os: { type: String, default: "" },
    browser: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

pageViewSchema.index({ createdAt: -1, site: 1 });
pageViewSchema.index({ path: 1, createdAt: -1 });
// Kept 90 days like product events; MongoDB removes older rows automatically
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const PageViewModel = models.PageView || model("PageView", pageViewSchema);
