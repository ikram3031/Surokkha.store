import { ContactMessageModel } from "../../common/models/contactMessage.model.js";
import { LogModel } from "../../common/models/log.model.js";
import { broadcastLiveNotification } from "../../common/websocket.js";
import { logger } from "../../common/config/logger.js";
import { sendContactAcknowledgementEmail } from "../../common/utils/contactEmailDelivery.js";

// Submits a new contact form message from the storefront customer
export const submitContact = async (req, res, next) => {
  try {
    const { fullName, name, email, phone, message } = req.body || {};

    const resolvedName = (fullName || name || "").trim();
    const resolvedEmail = (email || "").trim();
    const resolvedPhone = (phone || "").trim();
    const resolvedMessage = (message || "").trim();

    if (!resolvedName || !resolvedEmail || !resolvedMessage) {
      return res.status(400).json({
        status: "error",
        message: "Full name, email, and message are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resolvedEmail)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email address format.",
      });
    }

    const doc = await ContactMessageModel.create({
      fullName: resolvedName,
      email: resolvedEmail,
      phone: resolvedPhone,
      message: resolvedMessage,
      status: "new",
      active: true,
    });

    try {
      const log = await LogModel.create({
        type: "contactMessage",
        typeDid: doc.did || doc._id.toString(),
        description: `New contact message received from ${doc.fullName} (${doc.email})`,
        metadata: {
          contactId: doc._id.toString(),
          did: doc.did,
          fullName: doc.fullName,
          email: doc.email,
        },
        readStatus: false,
        active: true,
      });
      broadcastLiveNotification(log);
    } catch (logErr) {
      logger.error({ logErr }, "Failed to create activity log for contact submission");
    }

    sendContactAcknowledgementEmail(doc);

    return res.status(201).json({
      status: "success",
      message: "Thank you! Your message has been received.",
      data: {
        id: doc._id.toString(),
        did: doc.did,
      },
    });
  } catch (err) {
    next(err);
  }
};
