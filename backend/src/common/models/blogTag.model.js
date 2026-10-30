import mongoose, { Schema, model } from "mongoose";

const blogTagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
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

export const BlogTagModel = mongoose.models.BlogTag || model("BlogTag", blogTagSchema);
