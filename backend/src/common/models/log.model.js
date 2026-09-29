import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

export const LOG_TYPES = {
  NEW_ORDER: "newOrder",
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",
  CONTACT_MESSAGE: "contactMessage",
  WEBMAIL_MESSAGE: "webmailMessage",
};

export const LOG_TYPE_DIDS = {
  newOrder: "111",
  created: "110",
  updated: "121",
  deleted: "666",
  contactMessage: "112",
  webmailMessage: "113",
};

const logSchema = new Schema(
  {
    did: {
      type: String,
      default: () => generateDid(),
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["newOrder", "created", "updated", "deleted", "contactMessage", "webmailMessage"],
      default: "created",
      index: true,
    },
    typeDid: {
      type: String,
      required: true,
      default: function () {
        return LOG_TYPE_DIDS[this.type] || "110";
      },
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    readStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    updatedBy: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    collection: "logs",
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

export const LogModel = models.Log || model("Log", logSchema);
