import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const emailAddressSchema = new Schema(
  {
    name: { type: String, default: "" },
    address: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false }
);

const attachmentSchema = new Schema(
  {
    did: { type: String, default: () => generateDid() },
    filename: { type: String, default: "attachment" },
    contentType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
    url: { type: String, default: null },
    cid: { type: String, default: null },
  },
  { _id: true }
);

const emailMessageSchema = new Schema(
  {
    did: {
      type: String,
      default: () => generateDid(),
      unique: true,
      index: true,
    },
    uid: {
      type: Number,
      index: true,
    },
    messageId: {
      type: String,
      index: true,
    },
    folder: {
      type: String,
      enum: ["INBOX", "Sent", "Drafts", "Trash", "Spam", "Archive"],
      default: "INBOX",
      index: true,
    },
    from: {
      type: emailAddressSchema,
      required: true,
    },
    to: [emailAddressSchema],
    cc: [emailAddressSchema],
    bcc: [emailAddressSchema],
    replyTo: [emailAddressSchema],
    subject: {
      type: String,
      default: "(No Subject)",
      trim: true,
    },
    snippet: {
      type: String,
      default: "",
    },
    bodyHtml: {
      type: String,
      default: "",
    },
    bodyText: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    flags: {
      type: [String],
      default: [],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasAttachments: {
      type: Boolean,
      default: false,
    },
    attachments: [attachmentSchema],
    inReplyTo: {
      type: String,
      default: null,
    },
    references: {
      type: [String],
      default: [],
    },
    threadId: {
      type: String,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    collection: "email_messages",
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

emailMessageSchema.index({ folder: 1, date: -1 });
emailMessageSchema.index({ folder: 1, isRead: 1 });
emailMessageSchema.index({ "from.address": 1 });
emailMessageSchema.index({ subject: "text", bodyText: "text", snippet: "text" });

export const EmailMessageModel =
  models.EmailMessage || model("EmailMessage", emailMessageSchema);
