import { recordNotification, sendSystemMail, buildNotificationHtml, rowsToText, formatWhen } from "../services/notification.service.js";
import { SpamListModel } from "../models/spamList.model.js";
import { config } from "../config/index.js";

const matchedOn = (entry, { phone, email }) => {
  const parts = [];
  const core = String(phone || "").replace(/\D/g, "").slice(-10);
  if (core && String(entry?.phone || "").includes(core)) parts.push(`phone ${entry.phone}`);
  if (email && entry?.email && entry.email === String(email).trim().toLowerCase()) parts.push(`email ${entry.email}`);
  return parts.join(" + ") || "phone / email";
};

/**
 * Someone on the spam list reached checkout (stage "checkout") or had an order blocked (stage "order").
 * Dashboard bell + Webmail inbox copy only; no email goes out to anyone. Never throws.
 * info: { name, phone, email, address, items: [{ name, quantity, unitPrice }], total, sourceUrl, ip }
 */
export const notifySpamCheckout = async ({ entry, stage = "checkout", info = {} }) => {
  try {
    const brand = config.brandName || "Surokkha";
    const who = info.name || info.phone || info.email || "Unknown";
    const label = stage === "order" ? "Blocked order attempt" : "Spam list customer at checkout";
    const items = (info.items || [])
      .map((i) => `${i.name || i.slug || "Item"} × ${i.quantity || 1}${i.unitPrice ? ` (৳${i.unitPrice})` : ""}`)
      .join(", ");

    const rows = [
      ["What happened", label],
      ["When", formatWhen(new Date())],
      ["Matched on", matchedOn(entry, info)],
      ["Name", info.name || "-"],
      ["Phone", info.phone || "-"],
      ["Email", info.email || "-"],
      ["Address", info.address || "-"],
      ["Cart", items || "-"],
      ["Cart total", info.total ? `৳${Number(info.total).toLocaleString("en-US")}` : "-"],
      ["Page", info.sourceUrl || "-"],
      ["IP", info.ip || "-"],
    ];

    await recordNotification({
      type: "spam",
      typeDid: "120",
      description: `${label}: ${who} (${matchedOn(entry, info)})`,
      createdBy: "system",
    });
    await sendSystemMail({
      to: [],
      inbox: true,
      subject: `⚠️ ${brand}: ${label} – ${who}`,
      html: buildNotificationHtml({ heading: label, subheading: `${brand} · Spam list alert`, rows, accent: "#dc2626" }),
      text: rowsToText(rows),
    });
  } catch {
    // never let an alert break checkout
  }
};

// Spam list lookup by phone (last 10 digits) or email; never by IP (mobile operators share IPs)
export const findSpamEntry = async ({ phone, email } = {}) => {
  const or = [];
  const corePhone = String(phone || "").replace(/\D/g, "").slice(-10);
  if (corePhone.length === 10) or.push({ phone: { $regex: corePhone } });
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (cleanEmail) or.push({ email: cleanEmail });
  if (!or.length) return null;
  return SpamListModel.findOne({ $or: or }).lean();
};
