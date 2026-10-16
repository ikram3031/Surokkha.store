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
    sites: {
      store: {
        siteKey: { type: String, default: "store" },
        domain: { type: String, default: "surokkha.store" },
        brandName: { type: String, default: "Surokkha Store" },
        orderPrefix: { type: String, default: "SST" },
        metaPixel: {
          pixelId: { type: String, default: "", trim: true },
          accessToken: { type: String, default: "", trim: true },
          testEventCode: { type: String, default: "", trim: true },
          isEnabled: { type: Boolean, default: true },
          enableBrowserPixel: { type: Boolean, default: true },
          enableCapi: { type: Boolean, default: true },
          advancedMatching: { type: Boolean, default: true },
          lastVerifiedAt: { type: Date, default: null },
          lastTestStatus: {
            type: String,
            enum: ["connected", "failed", "untested"],
            default: "untested",
          },
          lastTestMessage: { type: String, default: "" },
        },
      },
      shop: {
        siteKey: { type: String, default: "shop" },
        domain: { type: String, default: "surokkha.shop" },
        brandName: { type: String, default: "Surokkha Shop" },
        orderPrefix: { type: String, default: "SSH" },
        metaPixel: {
          pixelId: { type: String, default: "", trim: true },
          accessToken: { type: String, default: "", trim: true },
          testEventCode: { type: String, default: "", trim: true },
          isEnabled: { type: Boolean, default: true },
          enableBrowserPixel: { type: Boolean, default: true },
          enableCapi: { type: Boolean, default: true },
          advancedMatching: { type: Boolean, default: true },
          lastVerifiedAt: { type: Date, default: null },
          lastTestStatus: {
            type: String,
            enum: ["connected", "failed", "untested"],
            default: "untested",
          },
          lastTestMessage: { type: String, default: "" },
        },
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
    smtp: {
      host: {
        type: String,
        default: "",
        trim: true,
      },
      port: {
        type: Number,
        default: 465,
      },
      secure: {
        type: Boolean,
        default: true,
      },
      user: {
        type: String,
        default: "",
        trim: true,
      },
      password: {
        type: String,
        default: "",
        trim: true,
      },
      senderName: {
        type: String,
        default: "",
        trim: true,
      },
      senderEmail: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },
    imap: {
      host: {
        type: String,
        default: "",
        trim: true,
      },
      port: {
        type: Number,
        default: 993,
      },
      secure: {
        type: Boolean,
        default: true,
      },
      user: {
        type: String,
        default: "",
        trim: true,
      },
      password: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: false,
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
      lastOrderSyncAt: { type: Date, default: null },
      lastOrderSyncSummary: { type: String, default: "" },
    },
    // Cloudflare R2 object storage used for automated backups (secret stored encrypted)
    r2Storage: {
      isEnabled: { type: Boolean, default: false },
      accountId: { type: String, trim: true, default: "" },
      accessKeyId: { type: String, trim: true, default: "" },
      secretAccessKey: { type: String, default: "" },
      bucketName: { type: String, trim: true, default: "" },
      publicUrl: { type: String, trim: true, default: "" },
      backupEnabled: { type: Boolean, default: true },
      backupCron: { type: String, trim: true, default: "0 3 * * *" },
      backupTimezone: { type: String, trim: true, default: "Asia/Dhaka" },
      retentionDays: { type: Number, default: 35, min: 1 },
      keepDailyDays: { type: Number, default: 7, min: 1 },
      keepWeeklyWeeks: { type: Number, default: 5, min: 0 },
      lastTestedAt: { type: Date, default: null },
      lastTestStatus: { type: String, enum: ["connected", "failed", "untested"], default: "untested" },
      lastTestMessage: { type: String, default: "" },
      lastBackupAt: { type: Date, default: null },
      lastBackupStatus: { type: String, enum: ["success", "failed", "running", "never"], default: "never" },
      lastBackupMessage: { type: String, default: "" },
      lastBackupSize: { type: String, default: "" },
    },
    cloudflare: {
      apiToken: {
        type: String,
        default: "",
        trim: true,
      },
      // Extra Cloudflare zones (e.g. the shop domain) used for cache purge, keyed by domain
      zones: [{ domain: { type: String, trim: true }, zoneId: { type: String, trim: true }, _id: false }],
      zoneId: {
        type: String,
        default: "",
        trim: true,
      },
      accountEmail: {
        type: String,
        default: "",
        trim: true,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      lastPurgedAt: {
        type: Date,
        default: null,
      },
    },
    templates: {
      preset: {
        type: String,
        enum: ["modern", "minimalist", "classic", "bold"],
        default: "modern",
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      branding: {
        primaryColor: { type: String, default: "#0f172a", trim: true },
        secondaryColor: { type: String, default: "#475569", trim: true },
        accentColor: { type: String, default: "#0284c7", trim: true },
        backgroundColor: { type: String, default: "#f8fafc", trim: true },
        cardBackground: { type: String, default: "#ffffff", trim: true },
        textColor: { type: String, default: "#0f172a", trim: true },
        mutedTextColor: { type: String, default: "#64748b", trim: true },
        borderColor: { type: String, default: "#e2e8f0", trim: true },
        fontFamily: {
          type: String,
          default: "Plus Jakarta Sans",
        },
        borderRadius: { type: Number, default: 8, min: 0, max: 24 },
      },
      header: {
        logoUrl: { type: String, default: "", trim: true },
        logoHeight: { type: Number, default: 44, min: 20, max: 120 },
        logoPlacement: {
          type: String,
          enum: ["left", "center", "right"],
          default: "left",
        },
        headerTitle: { type: String, default: "INVOICE", trim: true },
        headerSubtitle: { type: String, default: "Official Sales Receipt & Tax Document", trim: true },
        showWatermark: { type: Boolean, default: false },
        watermarkText: { type: String, default: "PAID", trim: true },
      },
      table: {
        showSku: { type: Boolean, default: false },
        showVariantBadge: { type: Boolean, default: true },
        showUnitPrice: { type: Boolean, default: true },
        zebraStripes: { type: Boolean, default: true },
        currencySymbol: { type: String, default: "৳", trim: true },
      },
      footer: {
        notesTitle: { type: String, default: "Special Notes", trim: true },
        notesContent: { type: String, default: "Thank you for shopping with us! For any support or inquiries, please contact our helpline.", trim: true },
        termsTitle: { type: String, default: "Terms & Conditions", trim: true },
        termsContent: { type: String, default: "1. Goods once sold can be exchanged within 7 days with original invoice.\n2. In case of transit damage, report within 24 hours.", trim: true },
        showSignatureSection: { type: Boolean, default: true },
        authorizedSignText: { type: String, default: "Authorized Signature & Seal", trim: true },
        signImageUrl: { type: String, default: "", trim: true },
        showQrCode: { type: Boolean, default: true },
        qrCodePosition: {
          type: String,
          enum: ["footer", "header"],
          default: "footer",
        },
        supportPhone: { type: String, default: "", trim: true },
        supportEmail: { type: String, default: "", trim: true },
        supportAddress: { type: String, default: "", trim: true },
      },
      email: {
        subjectTemplate: {
          type: String,
          default: "{{brandName}}: Order Confirmation #{{orderId}}",
          trim: true,
        },
        preheaderText: {
          type: String,
          default: "Thank you for your order! Here is your official invoice.",
          trim: true,
        },
        headerBannerBg: { type: String, default: "#0f172a", trim: true },
        headerTextColor: { type: String, default: "#ffffff", trim: true },
        ctaButtonText: { type: String, default: "View & Download Invoice", trim: true },
        ctaButtonColor: { type: String, default: "#0284c7", trim: true },
        customerGreeting: {
          type: String,
          default: "Hello {{customerName}}, thank you for shopping with us!",
          trim: true,
        },
        emailFooterText: {
          type: String,
          default: "If you have any questions, reply directly to this email or call our support team.",
          trim: true,
        },
      },
      customCss: { type: String, default: "", trim: true },
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
