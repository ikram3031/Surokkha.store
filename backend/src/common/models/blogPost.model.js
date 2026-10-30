import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

export const BLOG_POST_STATUSES = ["draft", "scheduled", "published", "trash"];

const seoSchema = new Schema(
  {
    focusKeyword: { type: String, trim: true, default: "" },
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    canonicalUrl: { type: String, trim: true, default: "" },
    robots: { type: String, enum: ["index,follow", "noindex,follow", "noindex,nofollow"], default: "index,follow" },
    score: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const blogPostSchema = new Schema(
  {
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    excerpt: { type: String, trim: true, default: "" },
    content: { type: String, default: "" },
    coverImageUrl: { type: String, trim: true, default: "" },
    coverImageAlt: { type: String, trim: true, default: "" },
    status: { type: String, enum: BLOG_POST_STATUSES, default: "draft", index: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    publishedAt: { type: Date, default: null, index: true },
    scheduledAt: { type: Date, default: null },
    categories: [{ type: Schema.Types.ObjectId, ref: "BlogCategory" }],
    tags: [{ type: String, trim: true, lowercase: true }],
    author: { type: Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, trim: true, default: "" },
    allowComments: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0, min: 0 },
    wordCount: { type: Number, default: 0, min: 0 },
    readingMinutes: { type: Number, default: 0, min: 0 },
    seo: { type: seoSchema, default: () => ({}) },
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

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });

export const BlogPostModel = mongoose.models.BlogPost || model("BlogPost", blogPostSchema);
