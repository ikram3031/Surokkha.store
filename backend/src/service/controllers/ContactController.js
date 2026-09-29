import { Types } from "mongoose";
import { ContactMessageModel } from "../../common/models/contactMessage.model.js";
import { LogModel } from "../../common/models/log.model.js";
import {
  sendContactAcknowledgment,
  sendContactReplyEmail,
  forwardContactInquiryToAdmin,
} from "../../common/utils/contactEmailDelivery.js";
import { broadcastLiveNotification } from "../../common/websocket.js";

// Helper to verify reCAPTCHA token with Google API
const verifyRecaptchaToken = async (token) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    // If not configured, pass verification in development
    return true;
  }
  if (!token) {
    return false;
  }
  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const verifyData = await verifyRes.json();
    return Boolean(verifyData && verifyData.success);
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    return false;
  }
};

// Public endpoint for submitting messages from website contact form
export const submitContact = async (req, res) => {
  try {
    const { name, email, phone = "", subject = "Website Contact Form", message, recaptchaToken } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    // Verify reCAPTCHA token if secret key is present
    if (process.env.RECAPTCHA_SECRET_KEY) {
      const isValidCaptcha = await verifyRecaptchaToken(recaptchaToken);
      if (!isValidCaptcha) {
        return res.status(400).json({
          success: false,
          message: "reCAPTCHA verification failed. Please try again.",
        });
      }
    }

    // 1. Save contact message to database
    const contactMessage = await ContactMessageModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "unread",
      active: true,
    });

    // 2. Send acknowledgment email to the customer asynchronously
    sendContactAcknowledgment({
      name: contactMessage.name,
      email: contactMessage.email,
      message: contactMessage.message,
    }).catch((err) => {
      console.error("Non-blocking contact acknowledgment error:", err);
    });

    // 2b. Forward the inquiry to store admin (kawaiikutir@gmail.com)
    forwardContactInquiryToAdmin({
      name: contactMessage.name,
      email: contactMessage.email,
      phone: contactMessage.phone,
      subject: contactMessage.subject,
      message: contactMessage.message,
    }).catch((err) => {
      console.error("Non-blocking admin contact forwarding error:", err);
    });

    // 3. Create a live notification in LogModel for the Dashboard
    try {
      const preview =
        contactMessage.message.length > 50
          ? `${contactMessage.message.slice(0, 47)}...`
          : contactMessage.message;
      const log = await LogModel.create({
        type: "contactMessage",
        typeDid: "112",
        description: `${contactMessage.name} sent a message: "${preview}"`,
        readStatus: false,
        active: true,
        createdBy: "storefront",
        updatedBy: "storefront",
      });

      broadcastLiveNotification(log).catch((wsErr) => {
        console.error("Non-blocking WS notification error on contact submit:", wsErr);
      });
    } catch (logErr) {
      console.error("Non-blocking contact log creation error:", logErr);
    }

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
      data: {
        did: contactMessage.did,
      },
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Lists all contact messages with search, filter, and pagination
export const listMessages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const filter = { active: true };

    if (req.query.status && ["unread", "read", "replied"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.q) {
      const q = req.query.q.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
        { did: { $regex: q, $options: "i" } },
      ];
    }

    const [messages, total, unreadCount, readCount, repliedCount] = await Promise.all([
      ContactMessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactMessageModel.countDocuments(filter),
      ContactMessageModel.countDocuments({ active: true, status: "unread" }),
      ContactMessageModel.countDocuments({ active: true, status: "read" }),
      ContactMessageModel.countDocuments({ active: true, status: "replied" }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      status: true,
      data: messages.map((m) => ({ ...m, id: m._id?.toString?.() ?? m.id })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total: unreadCount + readCount + repliedCount,
        unread: unreadCount,
        read: readCount,
        replied: repliedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Gets details of a single message and automatically marks it as read
export const getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }], active: true }
      : { did: id, active: true };

    const message = await ContactMessageModel.findOne(filter);

    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found.",
      });
    }

    // Auto mark as read if currently unread
    if (message.status === "unread") {
      message.status = "read";
      message.readAt = new Date();
      await message.save();
    }

    return res.json({
      status: true,
      data: { ...message.toJSON(), id: message._id?.toString?.() },
    });
  } catch (err) {
    next(err);
  }
};

// Sends an email reply to the customer and appends the reply to the conversation thread
export const replyToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message: replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({
        status: false,
        message: "Reply message text is required.",
      });
    }

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }], active: true }
      : { did: id, active: true };

    const contact = await ContactMessageModel.findOne(filter);

    if (!contact) {
      return res.status(404).json({
        status: false,
        message: "Message not found.",
      });
    }

    const adminName = req.user?.name || "Support Team";
    const adminEmail = req.user?.email || null;
    const adminDid = req.user?.did || req.user?.id || null;

    // Send the email to customer via SMTP
    await sendContactReplyEmail({
      toEmail: contact.email,
      customerName: contact.name,
      originalMessage: contact.message,
      replyMessage: replyText.trim(),
      adminName,
    });

    // Record reply into thread and update status
    contact.replies.push({
      senderDid: adminDid,
      senderName: adminName,
      senderEmail: adminEmail,
      message: replyText.trim(),
      sentAt: new Date(),
    });
    contact.status = "replied";
    await contact.save();

    return res.json({
      status: true,
      message: "Reply sent successfully to customer email.",
      data: { ...contact.toJSON(), id: contact._id?.toString?.() },
    });
  } catch (err) {
    next(err);
  }
};

// Updates read/unread/replied status of a message
export const updateMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["unread", "read", "replied"].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Status must be 'unread', 'read', or 'replied'.",
      });
    }

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }], active: true }
      : { did: id, active: true };

    const update = { status };
    if (status === "read") {
      update.readAt = new Date();
    }

    const message = await ContactMessageModel.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found.",
      });
    }

    return res.json({
      status: true,
      message: `Message marked as ${status}.`,
      data: { ...message.toJSON(), id: message._id?.toString?.() },
    });
  } catch (err) {
    next(err);
  }
};

// Soft deletes a single message
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }] }
      : { did: id };

    const message = await ContactMessageModel.findOneAndUpdate(
      filter,
      { $set: { active: false } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found.",
      });
    }

    return res.json({
      status: true,
      message: "Message deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// Bulk soft deletes messages
export const bulkDeleteMessages = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Array of message IDs is required for bulk deletion.",
      });
    }

    const objIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const dids = ids.filter((id) => !Types.ObjectId.isValid(id));
    const filter = {
      $or: [{ _id: { $in: objIds } }, { did: { $in: dids } }].filter(
        (c) => Object.values(c)[0].$in.length > 0
      ),
    };

    await ContactMessageModel.updateMany(filter, {
      $set: { active: false },
    });

    return res.json({
      status: true,
      message: `${ids.length} messages deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};
