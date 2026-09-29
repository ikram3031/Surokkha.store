import mongoose, { Schema, model } from "mongoose";

const storeUtilsSchema = new Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      index: true,
      trim: true,
    },
    featured: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    bestSeller: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    onSale: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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

export const StoreUtilsModel =
  mongoose.models.StoreUtils || model("StoreUtils", storeUtilsSchema);
