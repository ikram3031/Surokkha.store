import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const assetSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		did: {
			type: String,
			default: () => generateDid(),
			unique: true,
			index: true,
		},
		createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
		metadata: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true, versionKey: false },
);

export const AssetModel = models.Asset || model("Asset", assetSchema);
