import mongoose, { Schema, model } from "mongoose";

export const DEFAULT_ROBOTS = "User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /checkout/\nDisallow: /cart/";

const metaSchema = new Schema(
  {
    siteName: { type: String, trim: true, default: "" },
    separator: { type: String, trim: true, default: "|" },
    postTitleTemplate: { type: String, trim: true, default: "%post_title% %sep% %site_name%" },
    postDescriptionTemplate: { type: String, trim: true, default: "%excerpt%" },
    archiveTitle: { type: String, trim: true, default: "Blog %sep% %site_name%" },
    indexPosts: { type: Boolean, default: true },
  },
  { _id: false }
);

const socialSchema = new Schema(
  {
    ogEnabled: { type: Boolean, default: true },
    twitterEnabled: { type: Boolean, default: true },
    defaultImage: { type: String, trim: true, default: "" },
    twitterCard: { type: String, enum: ["summary_large_image", "summary"], default: "summary_large_image" },
    facebookAppId: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const schemaOrgSchema = new Schema(
  {
    organizationName: { type: String, trim: true, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    postType: { type: String, enum: ["Article", "BlogPosting", "NewsArticle"], default: "BlogPosting" },
    breadcrumbs: { type: Boolean, default: true },
    productSchema: { type: Boolean, default: true },
  },
  { _id: false }
);

const sitemapSchema = new Schema(
  {
    posts: { type: Boolean, default: true },
    taxonomy: { type: Boolean, default: true },
    lastGeneratedAt: { type: Date, default: null },
  },
  { _id: false }
);

const seoSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "blog" },
    meta: { type: metaSchema, default: () => ({}) },
    social: { type: socialSchema, default: () => ({}) },
    structuredData: { type: schemaOrgSchema, default: () => ({}) },
    sitemap: { type: sitemapSchema, default: () => ({}) },
    robots: { type: String, default: DEFAULT_ROBOTS },
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

export const SeoSettingsModel = mongoose.models.SeoSettings || model("SeoSettings", seoSettingsSchema);
