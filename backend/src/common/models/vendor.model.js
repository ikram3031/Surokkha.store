import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

// Who stock is bought from; purchases keep a copy of the name and phone they were saved with
const vendorSchema = new Schema(
  {
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, default: "", maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, default: "", maxlength: 120 },
    address: { type: String, trim: true, default: "", maxlength: 500 },
    notes: { type: String, trim: true, default: "", maxlength: 500 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    createdBy: { type: String, default: "system", trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

vendorSchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });

export const VendorModel = models.Vendor || model("Vendor", vendorSchema);
