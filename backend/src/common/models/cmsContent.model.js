import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

const chipSchema = new Schema(
  {
    label: { type: String, default: "", trim: true },
    color: { type: String, default: "#e05578", trim: true },
  },
  { _id: false },
);

const slideSchema = new Schema({
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  badge: { type: String, default: "", trim: true },
  titleDark: { type: String, default: "", trim: true },
  titleAccent: { type: String, default: "", trim: true },
  tagline: { type: [String], default: [] },
  subtitle: { type: String, default: "", trim: true },
  chips: { type: [chipSchema], default: [] },
  ctaLabel: { type: String, default: "Order Now", trim: true },
  ctaLink: { type: String, default: "", trim: true },
  ctaNote: { type: String, default: "", trim: true },
  footnote: { type: String, default: "", trim: true },
  image: { type: String, default: "", trim: true },
  imageAlt: { type: String, default: "", trim: true },
});

const cmsContentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    page: { type: String, default: "home", lowercase: true, trim: true, index: true },
    site: { type: String, enum: ["shop", "store"], default: "shop", index: true },
    type: { type: String, required: true, lowercase: true, trim: true, index: true },
    isActive: { type: Boolean, default: true },
    settings: {
      autoplay: { type: Boolean, default: true },
      speedMs: { type: Number, default: 5000, min: 1000, max: 60000 },
      transitionMs: { type: Number, default: 700, min: 100, max: 5000 },
      pauseOnHover: { type: Boolean, default: true },
      showArrows: { type: Boolean, default: true },
      showDots: { type: Boolean, default: true },
    },
    items: { type: [slideSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false },
);

cmsContentSchema.index({ site: 1, page: 1, type: 1 });

export const CMSContentModel = models.CMSContent || model("CMSContent", cmsContentSchema);
