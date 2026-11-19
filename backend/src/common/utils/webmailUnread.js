import { EmailMessageModel } from "../models/emailMessage.model.js";
import { broadcastEvent } from "../websocket.js";
import { logger } from "../config/logger.js";

// Counts unread active emails in the Webmail Inbox
export const getWebmailUnreadCount = () =>
  EmailMessageModel.countDocuments({ active: true, folder: "INBOX", isRead: false });

// Pushes the latest Inbox unread count to every connected dashboard for the sidebar badge
export const broadcastWebmailUnread = async () => {
  try {
    const unreadCount = await getWebmailUnreadCount();
    broadcastEvent("WEBMAIL_UNREAD_UPDATE", { unreadCount });
  } catch (err) {
    logger.warn({ err: err?.message }, "[Webmail] Failed to broadcast unread count");
  }
};
