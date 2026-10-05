import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

const fakeOrderSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    did: { type: String, required: true, index: true },
    orderType: { type: String, default: "online" },
    customer: {
      fullName: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      address: { type: String, trim: true, default: "" },
      thana: { type: String, trim: true, default: "" },
      district: { type: String, trim: true, default: "" },
      zip: { type: String, trim: true, default: "" },
    },
    billingInfo: { type: Schema.Types.Mixed, default: {} },
    shippingInfo: { type: Schema.Types.Mixed, default: {} },
    items: { type: [Schema.Types.Mixed], default: [] },
    totals: {
      subtotal: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    paymentMethod: { type: String, default: "" },
    member: { type: Schema.Types.ObjectId, ref: "Member", default: null },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    originalCreatedAt: { type: Date, default: null },
    reason: { type: String, default: "Marked as fake order", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  {
    collection: "fake_orders",
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
  },
);

fakeOrderSchema.index({ orderId: 1 }, { unique: true });

export const FakeOrderModel = models.FakeOrder || model("FakeOrder", fakeOrderSchema);
