import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const r2SyncLogSchema = new Schema(
  {
    did: {
      type: String,
      default: () => generateDid(),
      unique: true,
      index: true,
    },
    triggeredBy: {
      type: String,
      default: "SCHEDULER",
      trim: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "RUNNING", "PARTIAL"],
      default: "RUNNING",
      index: true,
    },
    totalLocalFiles: {
      type: Number,
      default: 0,
    },
    totalR2Files: {
      type: Number,
      default: 0,
    },
    syncedFilesCount: {
      type: Number,
      default: 0,
    },
    syncedFiles: [
      {
        _id: false,
        key: { type: String },
        size: { type: Number },
      },
    ],
    errorMessage: {
      type: String,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "r2_sync_logs",
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

export const R2SyncLogModel = models.R2SyncLog || model("R2SyncLog", r2SyncLogSchema);
