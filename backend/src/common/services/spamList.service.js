import { SpamListModel } from "../models/spamList.model.js";

const normalizePhone = (raw) => {
  const value = String(raw || "").trim();
  return value.replace(/\D/g, "").slice(-11) || value;
};

/**
 * Adds ip / phone / email to the spam list without creating a second entry for the same data.
 * If any of the given values is already listed, the existing entry is returned (its empty fields are filled in).
 */
export async function addToSpamList({ ip, phone, email } = {}) {
  const data = {
    ip: String(ip || "").trim(),
    phone: normalizePhone(phone),
    email: String(email || "").trim().toLowerCase(),
  };

  const matchers = Object.entries(data)
    .filter(([, value]) => value)
    .map(([field, value]) => ({ [field]: value }));
  if (!matchers.length) return { entry: null, created: false };

  const existing = await SpamListModel.findOne({ $or: matchers });
  if (existing) {
    let changed = false;
    for (const [field, value] of Object.entries(data)) {
      if (value && !existing[field]) {
        existing[field] = value;
        changed = true;
      }
    }
    if (changed) await existing.save();
    return { entry: existing, created: false };
  }

  const entry = await SpamListModel.create(data);
  return { entry, created: true };
}
