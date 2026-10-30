import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

export const BLOG_COMMENT_STATUSES = ["pending", "approved", "spam", "trash"];

const blogCommentSchema = new Schema(
  {
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    postId: { type: Schema.Types.ObjectId, ref: "BlogPost", required: true, index: true },
    postTitle: { type: String, trim: true, default: "" },
    postSlug: { type: String, trim: true, default: "" },
    parent: { type: Schema.Types.ObjectId, ref: "BlogComment", default: null },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    authorEmail: { type: String, trim: true, lowercase: true, default: "" },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: BLOG_COMMENT_STATUSES, default: "pending", index: true },
    isStaff: { type: Boolean, default: false },
    ip: { type: String, trim: true, default: "", index: true },
    userAgent: { type: String, trim: true, default: "" },
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

blogCommentSchema.index({ postId: 1, status: 1, createdAt: -1 });

export const BlogCommentModel = mongoose.models.BlogComment || model("BlogComment", blogCommentSchema);
