import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

// A customer who reached checkout. Kept so abandoned checkouts can be followed up and
// marked converted once the order is placed.
const checkoutLeadSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true, trim: true },
    fullName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    // Last 10 digits, used to match a lead to the order placed with the same number
    phoneKey: { type: String, default: "", index: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    thana: { type: String, default: "", trim: true },
    items: [
      {
        _id: false,
        slug: { type: String, default: "" },
        name: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
      },
    ],
    cartTotal: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    fbp: { type: String, default: "" },
    fbc: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    status: { type: String, enum: ["open", "converted"], default: "open", index: true },
    convertedOrderNumber: { type: String, default: "" },
    convertedAt: { type: Date },
    // InitiateCheckout is sent to Meta once per lead, as soon as a phone number is known
    metaSent: { type: Boolean, default: false },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, versionKey: false }
);

export const CheckoutLeadModel = models.CheckoutLead || model("CheckoutLead", checkoutLeadSchema);
