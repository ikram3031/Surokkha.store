import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

/**
 * Thana / Zone Schema (sub-document & individual model)
 */
const thanaSchema = new Schema(
  {
    zoneId: { type: Number, required: true, unique: true, index: true },
    cityId: { type: Number, required: true, index: true },
    districtName: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    bnName: { type: String, trim: true, default: "" },
    areasCount: { type: Number, default: 0 },
    areas: [
      {
        areaId: { type: Number },
        name: { type: String, trim: true },
        homeDeliveryAvailable: { type: Boolean, default: true },
        pickupAvailable: { type: Boolean, default: true },
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
    source: { type: String, enum: ["pathao", "seed", "custom"], default: "pathao" },
    lastSyncedAt: { type: Date, default: () => new Date() },
  },
  {
    collection: "thanas",
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

/**
 * District / City Schema
 */
const districtSchema = new Schema(
  {
    cityId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    bnName: { type: String, trim: true, default: "" },
    totalZones: { type: Number, default: 0 },
    thanas: [
      {
        zoneId: { type: Number, required: true },
        name: { type: String, required: true, trim: true },
        bnName: { type: String, trim: true, default: "" },
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
    source: { type: String, enum: ["pathao", "seed", "custom"], default: "pathao" },
    lastSyncedAt: { type: Date, default: () => new Date() },
  },
  {
    collection: "districts",
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

export const DistrictModel = models.District || model("District", districtSchema);
export const ThanaModel = models.Thana || model("Thana", thanaSchema);
