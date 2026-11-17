import crypto from "node:crypto";
import { MemberModel } from "../models/member.model.js";
import { OrderModel } from "../models/order.model.js";
import { hashPassword } from "../utils/password.js";

// Membership bonus: a customer who gives an email at checkout gets an account (no password yet).
// Once they verify that email (set a password with the emailed code, or the normal sign-up code),
// MEMBER_BONUS_PERCENT of that order's subtotal comes off the order, while it is still pending.
export const MEMBER_BONUS_PERCENT = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const memberBonusAmount = (subtotal) => Math.round((Number(subtotal) || 0) * (MEMBER_BONUS_PERCENT / 100));

// After a checkout order is saved: make sure the email has an account and mark the bonus on the order.
// Returns the bonus { percent, amount, status } or null. Never throws (the order is already placed).
export const offerMemberBonus = async (order) => {
  try {
    const email = String(order?.billingInfo?.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.includes("instore@")) return null;

    let member = await MemberModel.findOne({ email });
    if (member?.isEmailVerified && !member.registrationPending) return null; // already a member

    if (!member) {
      member = await MemberModel.create({
        name: String(order.billingInfo?.fullName || "Customer").trim().slice(0, 80) || "Customer",
        email,
        phone: String(order.billingInfo?.phone || "").trim(),
        // Random password nobody knows: the customer sets their own with the emailed code
        passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
        isEmailVerified: false,
        registrationPending: false,
        createdFromCheckout: true,
      });
    }

    const amount = memberBonusAmount(order.totals?.subtotal);
    if (amount <= 0) return null;
    const memberBonus = { percent: MEMBER_BONUS_PERCENT, amount, status: "pending" };
    await OrderModel.updateOne({ _id: order._id }, { $set: { memberBonus } });
    return memberBonus;
  } catch (err) {
    console.warn("[Member Bonus] could not offer bonus:", err.message);
    return null;
  }
};

// The email is now verified: take the bonus off this customer's latest order that still waits for it.
// Returns { orderNumber, amount, total } when applied, otherwise null.
export const applyMemberBonus = async (email) => {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return null;
  const order = await OrderModel.findOne({
    "billingInfo.email": clean,
    "memberBonus.status": "pending",
    status: "pending",
  }).sort({ createdAt: -1 });
  if (!order) return null;

  const amount = Math.min(order.memberBonus.amount, order.totals.total);
  order.totals.total = Math.max(0, order.totals.total - amount);
  order.discountTotalAmount = (order.discountTotalAmount || 0) + amount;
  order.memberBonus.status = "applied";
  order.memberBonus.appliedAt = new Date();
  order.markModified("memberBonus");
  await order.save();
  return { orderNumber: order.orderNumber, amount, total: order.totals.total };
};
