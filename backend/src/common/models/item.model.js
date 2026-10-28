import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const itemSchema = new Schema(
  {
    // Basic Details
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    description: { type: String, trim: true, default: "", required: function () { return this.type !== "group"; } },
    longDescription: { type: String, trim: true },

    isActive: { type: Boolean, default: true, index: true },
    excludeFromMetaCatalog: { type: Boolean, default: false, index: true },
    metaData: {
      metaTitle: { type: String, trim: true, default: "" },
      metaDescription: { type: String, trim: true, default: "" },
      keywords: [{ type: String, trim: true }],
      ogImage: { type: String, trim: true, default: "" },
    },

    // Item Type (Simple or Variant)
    type: {
      type: String,
      enum: ["simple", "variant", "group"],
      default: "simple",
      required: true,
      index: true
    },

    // Simple Item Fields (Type = "simple" hole eiti babohar hobe)
    price: {
      type: Number,
      min: 0,
      required: function () {
        return this.type === "simple";
      },
    },
    offerPrice: {
      type: Number,
      min: 0,
      default: null
    },
    sku: { type: String, trim: true },

    // Variant Item Fields (Type = "variant" hole eiti babohar hobe)
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

    // Group Offer Fields (Type = "group" hole eiti babohar hobe): customer picks pieces from several products
    groupOffer: {
      _id: false,
      products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      minOrderAmount: { type: Number, default: 250, min: 0 },
      minPerProduct: { type: Number, default: 2, min: 1 },
      pricingMode: { type: String, enum: ["fixed", "conditional"], default: "fixed" },
      fixedDiscount: {
        _id: false,
        discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
        discountValue: { type: Number, min: 0, default: 0 },
      },
      conditions: [
        {
          _id: false,
          minOrderAmount: { type: Number, required: true, min: 0 },
          discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
          discountValue: { type: Number, min: 0, default: 0 },
        },
      ],
    },

    tags: [{ type: String, trim: true, lowercase: true }],

    // SEO Meta Data
    metaData: {
      _id: false,
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
      ogImage: { type: String, trim: true },
    },

    // Brand & Categories (Reference)
    brand: [{ type: String, trim: true }],
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category"
      }
    ],

    // Images
    imageUrl: { type: String, trim: true, default: "", required: function () { return this.type !== "group"; } },
    thumbnailUrl: { type: String, trim: true },
    gallery: [{ type: String, trim: true }],

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

    // Rich Specifications & Details
    origin: { type: String, default: "China Imported", trim: true },
    expiryDate: { type: String, default: "2030", trim: true },
    packSize: { type: String, default: "", trim: true },
    specifications: { type: Schema.Types.Mixed, default: {} },
    benefits: { type: [Schema.Types.Mixed], default: [] },
    sections: { type: [Schema.Types.Mixed], default: [] },
    packageContents: { type: String, default: "", trim: true },

    // Bengali / Multi-language Localization Payload
    bn: { type: Schema.Types.Mixed, default: {} },

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

// Indexes
itemSchema.index({ price: 1, offerPrice: 1 });
itemSchema.index({ "variants.price": 1, "variants.offerPrice": 1 });
itemSchema.index({ categories: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ name: "text", description: "text", tags: "text" });

export const ItemModel = mongoose.models.Item || model("Item", itemSchema);
