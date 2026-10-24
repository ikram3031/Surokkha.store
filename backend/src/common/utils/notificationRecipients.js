import { EmailNotificationRecipientModel } from "../models/emailNotificationRecipient.model.js";

// Returns the emails that should receive admin alert emails
export const getNotificationRecipientEmails = async () => {
  const rows = await EmailNotificationRecipientModel.find().select("email").lean();
  return rows.map((row) => row.email).filter(Boolean);
};

// Returns the set of user ids (as strings) currently on the recipient list
export const getNotificationRecipientUserIds = async () => {
  const rows = await EmailNotificationRecipientModel.find({ userId: { $ne: null } }).select("userId").lean();
  return new Set(rows.map((row) => String(row.userId)));
};

// Adds the user to the recipient list when enabled, removes them when disabled
export const setUserEmailNotification = async (user, enabled) => {
  if (!enabled) {
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
