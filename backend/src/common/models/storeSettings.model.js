import mongoose, { Schema, model } from "mongoose";

const storeSettingsSchema = new Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
      index: true,
      trim: true,
    },
    metaPixel: {
      pixelId: {
        type: String,
        default: "",
        trim: true,
      },
      accessToken: {
        type: String,
        default: "",
        trim: true,
      },
      testEventCode: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      enableBrowserPixel: {
        type: Boolean,
        default: true,
      },
      enableCapi: {
        type: Boolean,
        default: true,
      },
      advancedMatching: {
        type: Boolean,
        default: true,
      },
      lastVerifiedAt: {
        type: Date,
        default: null,
      },
      lastTestStatus: {
        type: String,
        enum: ["connected", "failed", "untested"],
        default: "untested",
      },
      lastTestMessage: {
        type: String,
        default: "",
      },
    },
    tiktokPixel: {
      pixelId: {
        type: String,
        default: "",
        trim: true,
      },
      accessToken: {
        type: String,
        default: "",
        trim: true,
      },
      testEventCode: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      enableBrowserPixel: {
        type: Boolean,
        default: true,
      },
      enableEventsApi: {
        type: Boolean,
        default: true,
      },
      advancedMatching: {
        type: Boolean,
        default: true,
      },
      lastVerifiedAt: {
        type: Date,
        default: null,
      },
      lastTestStatus: {
        type: String,
        enum: ["connected", "failed", "untested"],
        default: "untested",
      },
      lastTestMessage: {
        type: String,
        default: "",
      },
    },
    googleAnalytics: {
      measurementId: {
        type: String,
        default: "",
        trim: true,
      },
      gtmId: {
        type: String,
        default: "",
        trim: true,
      },
      propertyId: {
        type: String,
        default: "",
        trim: true,
      },
      streamName: {
        type: String,
        default: "",
        trim: true,
      },
      lookerStudioEmbedUrl: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      enhancedMeasurement: {
        type: Boolean,
        default: true,
      },
      lastVerifiedAt: {
        type: Date,
        default: null,
      },
    },
    seo: {
      metaTitle: {
        type: String,
        default: "",
        trim: true,
      },
      metaDescription: {
        type: String,
        default: "",
        trim: true,
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
      ogImage: {
        type: String,
        default: "",
        trim: true,
      },
      siteName: {
        type: String,
        default: "",
        trim: true,
      },
      twitterHandle: {
        type: String,
        default: "",
        trim: true,
      },
      canonicalBaseUrl: {
        type: String,
        default: "",
        trim: true,
      },
      robotsTxt: {
        type: String,
        default: "",
        trim: true,
      },
      gscVerificationCode: {
        type: String,
        default: "",
        trim: true,
      },
    },
    pathaoCourier: {
      baseUrl: {
        type: String,
        default: "https://api-hermes.pathao.com",
        trim: true,
      },
      environment: {
        type: String,
        enum: ["sandbox", "production"],
        default: "production",
      },
      clientId: {
        type: String,
        default: "",
        trim: true,
      },
      clientSecret: {
        type: String,
        default: "",
        trim: true,
      },
      username: {
        type: String,
        default: "",
        trim: true,
      },
      password: {
        type: String,
        default: "",
        trim: true,
      },
      storeId: {
        type: Number,
        default: null,
      },
      storeName: {
        type: String,
        default: "",
        trim: true,
      },
      storeAddress: {
        type: String,
        default: "",
        trim: true,
      },
      defaultItemWeight: {
        type: Number,
        default: 0.5,
      },
      defaultItemType: {
        type: Number,
        default: 2,
      },
      defaultDeliveryType: {
        type: Number,
        default: 48,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      accessToken: {
        type: String,
        default: "",
      },
      refreshToken: {
        type: String,
        default: "",
      },
      tokenExpiresAt: {
        type: Date,
        default: null,
      },
      lastTestedAt: {
        type: Date,
        default: null,
      },
      lastTestStatus: {
        type: String,
        enum: ["connected", "failed", "untested"],
        default: "untested",
      },
      lastTestMessage: {
        type: String,
        default: "",
      },
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

export const StoreSettingsModel =
  mongoose.models.StoreSettings || model("StoreSettings", storeSettingsSchema);
