import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// Running deploy version of the Surokkha stack. Version is main.major.minor; every `make deploy`
// adds 1 to minor, and minor rolls into major after 99 (same scheme as Plexivia).
export const MINOR_MAX = 99;
export const formatVersion = (main, major, minor) => `${main}.${major}.${String(minor).padStart(2, "0")}`;

const deployEntrySchema = new Schema(
  { version: String, commit: String, branch: String, host: String, at: Date },
  { _id: false }
);

const deployVersionSchema = new Schema(
  {
    target: { type: String, required: true, unique: true, uppercase: true, trim: true },
    main: { type: Number, default: 1, min: 0 },
    major: { type: Number, default: 0, min: 0 },
    minor: { type: Number, default: 0, min: 0, max: MINOR_MAX },
    version: { type: String, default: "1.0.00" },
    lastDeployedAt: { type: Date },
    history: { type: [deployEntrySchema], default: [] },
  },
  { timestamps: true, collection: "deploy_versions" }
);

export const DeployVersionModel = models.DeployVersion || model("DeployVersion", deployVersionSchema);
