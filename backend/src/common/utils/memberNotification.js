import { LOG_TYPES, LOG_TYPE_DIDS } from "../models/log.model.js";
import { config } from "../config/index.js";
import { recordNotification, sendSystemMail, buildNotificationHtml, rowsToText, formatWhen } from "../services/notification.service.js";

// Records a dashboard notification and emails the Webmail mailbox on new member registration
export const notifyMemberRegistered = (member) => {
  if (!member?.email) return;

  setImmediate(async () => {
    const name = String(member.name || "").trim() || member.email;
    const email = String(member.email || "").trim().toLowerCase();
    const phone = String(member.phone || "").trim();
    const brand = config.brandName || "Surokkha";

    await recordNotification({
      type: LOG_TYPES.NEW_MEMBER,
      typeDid: LOG_TYPE_DIDS.newMember,
      description: `New member registered: ${name} (${email})`,
      createdBy: "customer",
    });

    const rows = [
      ["Name", name],
      ["Email", email],
      ...(phone ? [["Phone", phone]] : []),
      ["Registered At", formatWhen(new Date())],
    ];
    // Inbox copy first; SMTP to the Webmail address only when the inbox copy is unavailable
    await sendSystemMail({
      to: [],
      smtpFallbackToWebmail: true,
      replyTo: email,
      subject: `New Member Registered: ${name} (${email})`,
      html: buildNotificationHtml({ heading: "New Member Registered", subheading: brand, rows }),
      text: `A new member has registered on ${brand}.\n\n${rowsToText(rows)}`,
    });
  });
};
