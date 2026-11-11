import mongoose, { Schema, model } from "mongoose";
import { nextFormattedId } from "../services/idFormat.service.js";

const { models } = mongoose;

export const PURCHASE_STATUSES = ["draft", "ordered", "received", "cancelled"];

// One bought item: units = packs × unitsPerPack, unitCost = total / units
const purchaseLineSchema = new Schema(
  {
    stockItemId: { type: Schema.Types.ObjectId, ref: "StockItem", required: true },
    shortName: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    unit: { type: String, default: "pcs", trim: true },
    packLabel: { type: String, default: "", trim: true },
    packs: { type: Number, required: true },
    unitsPerPack: { type: Number, required: true, default: 1 },
    units: { type: Number, required: true },
    packPrice: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

// Money paid to the vendor against this purchase
const purchasePaymentSchema = new Schema({
  method: { type: String, required: true, trim: true },
  paymentTypeId: { type: Schema.Types.ObjectId, ref: "PaymentType", default: null },
  amount: { type: Number, required: true, min: 0 },
  reference: { type: String, default: "", trim: true },
  paidAt: { type: Date, default: () => new Date() },
  note: { type: String, default: "", trim: true },
});

// Stock bought from a vendor: draft → ordered → received (units go into stock items), or cancelled
const purchaseSchema = new Schema(
  {
    purchaseNumber: { type: String, required: true, unique: true, trim: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", default: null, index: true },
    vendorName: { type: String, required: true, trim: true },
    vendorPhone: { type: String, default: "", trim: true },
    vendorEmail: { type: String, default: "", trim: true },
    orderDate: { type: Date, default: () => new Date() },
    receivedAt: { type: Date, default: null },
    status: { type: String, enum: PURCHASE_STATUSES, default: "draft", index: true },
    lines: { type: [purchaseLineSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    payments: { type: [purchasePaymentSchema], default: [] },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
    // The "Product Purchase" bill kept in step with this purchase
    billingId: { type: Schema.Types.ObjectId, ref: "Billing", default: null },
    // Bumped every time the stock receipt is re-applied, so the same state never moves stock twice
    stockVersion: { type: Number, default: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    createdBy: { type: String, default: "system", trim: true },
    updatedBy: { type: String, default: "system", trim: true },
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

purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ "lines.shortName": 1 });

export const PurchaseModel = models.Purchase || model("Purchase", purchaseSchema);

// Monthly serials for purchase numbers
const purchaseCounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
const PurchaseCounterModel = models.PurchaseCounter || model("PurchaseCounter", purchaseCounterSchema);

// Purchase numbers like PO-2611-0001: year + month + serial, numbered per month
export const nextPurchaseNumber = async (date = new Date()) => {
  // A format set in Business Settings wins; otherwise the built-in PO-YYMM-NNNN
  const formatted = await nextFormattedId("purchase", (id) => PurchaseModel.exists({ purchaseNumber: id }), date);
  if (formatted) return formatted;
  const ym = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const counter = await PurchaseCounterModel.findOneAndUpdate({ _id: `purchase:${ym}` }, { $inc: { seq: 1 } }, { new: true, upsert: true }).lean();
  return `PO-${ym}-${String(counter.seq).padStart(4, "0")}`;
};
