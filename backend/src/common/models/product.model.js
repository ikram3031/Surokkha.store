import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const productSchema = new Schema(
  {
    // Basic Details
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    description: { type: String, required: true, trim: true },
    longDescription: { type: String, trim: true },
    chargeTax: { type: Boolean, default: false },
    taxRate: { type: Number, default: null },
    isActive: { type: Boolean, default: true, index: true },
    metaData: {
      metaTitle: { type: String, trim: true, default: "" },
      metaDescription: { type: String, trim: true, default: "" },
      keywords: [{ type: String, trim: true }],
      ogImage: { type: String, trim: true, default: "" },
    },

    // Product Type (Simple or Variant)
    type: {
      type: String,
      enum: ["simple", "variant"],
      default: "simple",
      required: true,
      index: true
    },

    // Simple Product Fields (Type = "simple" hole eiti babohar hobe)
    price: {
      type: Number,
      min: 0,
      required: function () {
        return this.type === "simple"; // Simple product hole price mandatory
      },
    },
    offerPrice: {
      type: Number,
      min: 0,
      default: null
    },
    sku: { type: String, trim: true },

    // Variant Product Fields (Type = "variant" hole eiti babohar hobe)
    variants: [
      {
        _id: false,
        size: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        offerPrice: { type: Number, min: 0, default: null },
        sku: { type: String, trim: true },
        sortOrder: { type: Number, default: 0 },
        imageUrl: { type: String, default: null, trim: true },
        stockStatus: {
          type: String,
          enum: ["instock", "outofstock", "preorder"],
          default: "instock",
        },
      },
    ],

    // Filtering, Season & Notes
    season: [{
      type: String,
      enum: ["Summer", "Winter", "Spring", "Autumn", "All-Season"],
    }],
    tags: [{ type: String, trim: true, lowercase: true }],
    notes: [{ type: String, trim: true }],

    // SEO Meta Data
    metaData: {
      _id: false,
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
      ogImage: { type: String, trim: true },
    },

    // Brand & Categories (Reference)
    // brand: array of `did` strings — [sub-brand-did, parent-brand-did]
    brand: [{ type: String, trim: true }],
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category"
      }
    ],

    // Images
    imageUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true }, // Product thumbnail image
    images: [{ type: String, trim: true }],

    stockStatus: {
      type: String,
      enum: ["instock", "outofstock", "preorder"],
      default: "instock",
      index: true
    },

    stockAmount: {
      type: Number,
      min: 0,
      default: 0,
      index: true
    },

    // Audit Fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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

// Price Filtering index (Duto price ebong offerPrice index kora, jeno fast query kora jay)
productSchema.index({ price: 1, offerPrice: 1 });
productSchema.index({ "variants.price": 1, "variants.offerPrice": 1 });
productSchema.index({ categories: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

export const ProductModel = mongoose.models.Product || model("Product", productSchema);