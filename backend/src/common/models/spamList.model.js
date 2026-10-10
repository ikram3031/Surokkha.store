import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

const spamListSchema = new Schema(
  {
    ip: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
  },
  {
    collection: "spam_list",
    timestamps: true, // This adds createdAt and updatedAt
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret._id;
        return ret;
      },
    },
  }
);

// Add index for fast lookups if we ever want to query by these fields
spamListSchema.index({ phone: 1 });
spamListSchema.index({ email: 1 });
spamListSchema.index({ ip: 1 });

export const SpamListModel = models.SpamList || model("SpamList", spamListSchema);
