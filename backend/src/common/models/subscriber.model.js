import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

const subscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SubscriberModel = models.Subscriber || model("Subscriber", subscriberSchema);
