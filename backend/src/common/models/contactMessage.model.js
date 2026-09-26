import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const replySchema = new Schema(
  {
    did: {
      type: String,
      default: () => generateDid(),
    },
    senderDid: {
      type: String,
      default: null,
      trim: true,
    },
    senderName: {
      type: String,
      default: "Support Team",
      trim: true,
    },
    senderEmail: {
      type: String,
      default: null,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const contactMessageSchema = new Schema(
  {
    did: {
      type: String,
      default: () => generateDid(),
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "Website Contact Form",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied"],
      default: "unread",
      index: true,
    },
    replies: [replySchema],
    readAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    collection: "contact_messages",
    timestamps: true,
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

export const ContactMessageModel =
  models.ContactMessage || model("ContactMessage", contactMessageSchema);
