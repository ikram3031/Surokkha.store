import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// One row per system user who should receive admin alert emails (new orders, contact inquiries).
// Toggling on inserts the row, toggling off deletes it.
const emailNotificationRecipientSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const EmailNotificationRecipientModel =
  models.EmailNotificationRecipient || model("EmailNotificationRecipient", emailNotificationRecipientSchema);
