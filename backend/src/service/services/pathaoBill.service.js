import { BillingModel } from "../../common/models/billing.model.js";
import { BillTypeModel } from "../../common/models/billType.model.js";
import { estimateCourierCharge, invoiceDateFromId, PAID_OUT_STATUSES } from "./pathaoCourierEvents.service.js";

// Bills this service owns are tagged so staff-entered bills (e.g. a manual return fee) are never touched
const AUTO_BILLING_METHOD = "pathao";
const DELIVERY_BILL_TYPE = "Delivery Charge";
const RETURN_BILL_TYPE = "Return";
const CANCELLED_STATUSES = ["cancelled", "canceled", "fake"];

const round2 = (n) => Math.round(n * 100) / 100;

const billTypeCache = new Map();
const getBillTypeId = async (name) => {
  if (billTypeCache.has(name)) return billTypeCache.get(name);
  const type = (await BillTypeModel.findOne({ name }).select("_id").lean()) || (await BillTypeModel.create({ name }));
  billTypeCache.set(name, type._id);
  return type._id;
};

// Pathao's charge for the order: settlement figures once delivered/returned, else the dispatch estimate
const courierChargeFor = (order) => {
  const courier = order.courier || {};
  const s = courier.settlement || {};
  if (s.status && s.status !== "none") return Number(s.totalCharge || 0);
  const toCollect = Number(courier.amountToCollect ?? order.totals?.total ?? 0);
  const { deliveryCharge, codFee } = estimateCourierCharge(courier, toCollect);
  return round2(deliveryCharge + codFee);
};

// The day Pathao paid out and took its charge: the invoice id's date, else when the payout was recorded
const payoutDate = (order) => {
  const s = order.courier?.settlement || {};
  return invoiceDateFromId(s.invoiceId) || s.settledAt || s.invoicedAt || null;
};

const billDetails = (order, isReturn) => {
  const orderRef = order.orderNumber || order.did || order._id;
  const customer = order.shippingInfo || order.billingInfo || {};
  const customerName = customer.fullName || "Customer";
  const consignment = order.courier?.consignmentId || "";
  return {
    title: `${isReturn ? "Pathao return charge" : "Pathao delivery charge"} - Order #${orderRef} - ${customerName}`,
    name: "Pathao Courier",
    billingPhone: customer.phone || "",
    notes: `Auto-synced from Pathao. Consignment ${consignment}. Order #${orderRef}, customer ${customerName}.`,
  };
};

/**
 * Keeps one auto bill per Pathao order in step with the order:
 * pending while in transit/awaiting payout, paid once Pathao pays the invoice,
 * re-typed to "Return" on return, deleted when the delivery is cancelled.
 */
export const syncCourierBill = async (order) => {
  const courier = order.courier || {};
  const filter = { orderId: order._id, billingMethod: AUTO_BILLING_METHOD };

  const isCancelled =
    !courier.consignmentId || CANCELLED_STATUSES.includes(order.status) || /pickup_cancel/.test(courier.orderStatusSlug || "");
  if (isCancelled) {
    await BillingModel.deleteOne(filter);
    return "deleted";
  }

  const isReturn = order.status === "return";
  const billTypeId = await getBillTypeId(isReturn ? RETURN_BILL_TYPE : DELIVERY_BILL_TYPE);

  // A return fee entered by staff already covers this parcel
  if (isReturn) {
    const manualReturnBill = await BillingModel.exists({ orderId: order._id, billTypeId, billingMethod: { $ne: AUTO_BILLING_METHOD } });
    if (manualReturnBill) {
      await BillingModel.deleteOne(filter);
      return "manual return bill";
    }
  }

  const amount = courierChargeFor(order);
  if (!(amount > 0)) {
    await BillingModel.deleteOne(filter);
    return "no charge";
  }

  const isPaid = PAID_OUT_STATUSES.includes(courier.settlement?.status);
  // Paid bills are dated the day Pathao took the money; pending ones stay on the dispatch date
  const paidOn = isPaid ? payoutDate(order) : null;
  await BillingModel.findOneAndUpdate(
    filter,
    {
      $set: {
        billTypeId,
        ...billDetails(order, isReturn),
        billingDate: paidOn || courier.dispatchedAt || new Date(),
        dueDate: paidOn,
        baseAmount: amount,
        totalAmount: amount,
        amount,
        paidAmount: isPaid ? amount : 0,
        pendingAmount: isPaid ? 0 : amount,
        status: isPaid ? "paid" : "pending",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return isPaid ? "paid" : "pending";
};
