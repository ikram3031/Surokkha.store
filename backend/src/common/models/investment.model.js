import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const investmentSchema = new Schema(
  {
    investorId: { type: Schema.Types.ObjectId, ref: "Investor", required: true, index: true },
    takenAmount: { type: Number, required: true, min: 0 },
    returnedAmount: { type: Number, required: true, min: 0, default: 0 },
    takenDate: { type: Date, default: () => new Date() },
    returnedDate: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: ["active", "returned", "partial", "pending"],
      default: "active",
    },
    paymentMethod: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
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

export const InvestmentModel = models.Investment || model("Investment", investmentSchema);
