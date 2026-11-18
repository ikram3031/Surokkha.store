import { EmailNotificationRecipientModel } from "../models/emailNotificationRecipient.model.js";
import { UserModel } from "../models/user.model.js";

// Returns distinct, non-empty lowercase emails of all active Owner accounts
export const getOwnerEmails = async () => {
  const owners = await UserModel.find({ role: "Owner", isActive: true }).select("email").lean();
  const emails = owners.map((owner) => String(owner.email || "").toLowerCase().trim()).filter(Boolean);
  return [...new Set(emails)];
};

// Returns the emails that should receive admin alert emails (skipping inactive or deleted linked users)
export const getNotificationRecipientEmails = async () => {
  const rows = await EmailNotificationRecipientModel.find().select("email userId").lean();
  const linkedUserIds = rows.map((row) => row.userId).filter(Boolean);
  let activeUserIds = new Set();
  if (linkedUserIds.length > 0) {
    const activeUsers = await UserModel.find({ _id: { $in: linkedUserIds }, isActive: true })
      .select("_id")
      .lean();
    activeUserIds = new Set(activeUsers.map((user) => String(user._id)));
  }
  return rows
    .filter((row) => !row.userId || activeUserIds.has(String(row.userId)))
    .map((row) => row.email)
    .filter(Boolean);
};

// Admin alert targets: active toggled users on the dashboard recipient list.
export const resolveAlertRecipients = async (_smtpConfig = {}, extraExcluded = []) => {
  const normalize = (addr) => String(addr || "").toLowerCase().trim();
  const excludedInput = Array.isArray(_smtpConfig) ? _smtpConfig : extraExcluded;
  const excluded = new Set((Array.isArray(excludedInput) ? excludedInput : []).map(normalize).filter(Boolean));
  const set = new Set((await getNotificationRecipientEmails()).map(normalize));
  return [...set].filter((addr) => addr && !excluded.has(addr));
};

// Returns the set of active user ids (as strings) currently on the recipient list
export const getNotificationRecipientUserIds = async () => {
  const rows = await EmailNotificationRecipientModel.find({ userId: { $ne: null } }).select("userId").lean();
  const userIds = rows.map((row) => row.userId).filter(Boolean);
  if (userIds.length === 0) return new Set();
  const activeUsers = await UserModel.find({ _id: { $in: userIds }, isActive: true }).select("_id").lean();
  return new Set(activeUsers.map((user) => String(user._id)));
};

// Adds an active user to the recipient list when enabled, removes them when disabled or inactive
export const setUserEmailNotification = async (user, enabled) => {
  if (!enabled || user?.isActive === false) {
    await EmailNotificationRecipientModel.deleteMany({ userId: user._id });
    return;
  }
  const email = String(user.email || "").toLowerCase().trim();
  if (!email) return;
  // Drop any stale row for this user under an older email before upserting by email
  await EmailNotificationRecipientModel.deleteMany({ userId: user._id, email: { $ne: email } });
  await EmailNotificationRecipientModel.updateOne(
    { email },
    { $set: { email, userId: user._id, name: user.name || "" } },
    { upsert: true }
  );
};

// Keeps an existing recipient row in step when the user's email or name changes
export const syncUserNotificationRecipient = async (user) => {
  const existing = await EmailNotificationRecipientModel.exists({ userId: user._id });
  if (existing) await setUserEmailNotification(user, true);
};

// Removes the user's recipient row (used when the user is deleted)
export const removeUserNotificationRecipient = async (userId) => {
  await EmailNotificationRecipientModel.deleteMany({ userId });
};
