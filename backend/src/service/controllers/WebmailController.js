import { Types } from "mongoose";
import nodemailer from "nodemailer";
import { EmailMessageModel } from "../../common/models/emailMessage.model.js";
import { ContactMessageModel } from "../../common/models/contactMessage.model.js";
import { env } from "../../common/config/env.js";
import {
  syncAllMailFolders,
  appendEmailToSentFolder,
} from "../../common/services/imapSync.service.js";

let defaultTransport = null;

// Returns configured nodemailer transport for sending outbound webmail
const getSmtpTransport = () => {
  if (!defaultTransport) {
    const isSecure =
      Number(env.SMTP_PORT) === 465 ||
      String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

    const isLocalhost = env.SMTP_HOST === "127.0.0.1" || env.SMTP_HOST === "localhost";
    const hasAuth = !isLocalhost && env.SMTP_PASSWORD && env.SMTP_PASSWORD !== "none" && env.SMTP_USER;

    const transportConfig = {
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: isSecure,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    };

    if (hasAuth) {
      transportConfig.auth = {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      };
    }

    defaultTransport = nodemailer.createTransport(transportConfig);
  }
  return defaultTransport;
};

// Lists webmail messages with folder, status filtering, search, and pagination
export const listWebmailMessages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const skip = (page - 1) * limit;

    const folder = req.query.folder || "INBOX";
    const filter = { active: true };

    if (folder === "Starred") {
      filter.isStarred = true;
    } else if (["INBOX", "Sent", "Drafts", "Trash", "Spam", "Archive"].includes(folder)) {
      filter.folder = folder;
    }

    if (req.query.q) {
      const q = req.query.q.trim();
      filter.$or = [
        { subject: { $regex: q, $options: "i" } },
        { "from.name": { $regex: q, $options: "i" } },
        { "from.address": { $regex: q, $options: "i" } },
        { snippet: { $regex: q, $options: "i" } },
        { bodyText: { $regex: q, $options: "i" } },
      ];
    }

    const [messages, total, inboxUnread, starredCount, sentCount, trashCount, inquiriesUnread] =
      await Promise.all([
        EmailMessageModel.find(filter)
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .select("-bodyHtml")
          .lean(),
        EmailMessageModel.countDocuments(filter),
        EmailMessageModel.countDocuments({ active: true, folder: "INBOX", isRead: false }),
        EmailMessageModel.countDocuments({ active: true, isStarred: true }),
        EmailMessageModel.countDocuments({ active: true, folder: "Sent" }),
        EmailMessageModel.countDocuments({ active: true, folder: "Trash" }),
        ContactMessageModel.countDocuments({ active: true, status: "unread" }),
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
        inboxUnread,
        starredCount,
        sentCount,
        trashCount,
        inquiriesUnread,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Gets single email details and thread history with auto-read marking
export const getWebmailMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }], active: true }
      : { did: id, active: true };

    const message = await EmailMessageModel.findOne(filter);

    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Email message not found.",
      });
    }

    if (!message.isRead) {
      message.isRead = true;
      await message.save();
    }

    let thread = [];
    if (message.threadId) {
      thread = await EmailMessageModel.find({
        threadId: message.threadId,
        _id: { $ne: message._id },
        active: true,
      })
        .sort({ date: 1 })
        .lean();
    }

    return res.json({
      status: true,
      data: {
        ...message.toJSON(),
        id: message._id?.toString?.(),
        thread: thread.map((t) => ({ ...t, id: t._id?.toString?.() ?? t.id })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Sends a new email message or reply via SMTP and records in database & IMAP Sent
export const sendWebmailMessage = async (req, res, next) => {
  try {
    const { to, cc, bcc, subject, bodyHtml, bodyText, inReplyTo, references, threadId } = req.body;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({
        status: false,
        message: "Recipient email address is required.",
      });
    }

    const transport = getSmtpTransport();
    const fromName = env.SMTP_FROM_NAME || "Decantre BD";
    const fromAddress = env.SMTP_FROM || env.SMTP_USER;

    const toAddresses = Array.isArray(to)
      ? to.map((t) => (typeof t === "string" ? t : t.address)).filter(Boolean)
      : [to];

    const mailOptions = {
      from: {
        name: fromName,
        address: fromAddress,
      },
      to: toAddresses.join(", "),
      subject: subject || "(No Subject)",
      html: bodyHtml || `<p>${(bodyText || "").replace(/\n/g, "<br>")}</p>`,
      text: bodyText || "",
    };

    if (cc) {
      const ccList = Array.isArray(cc) ? cc.map((c) => (typeof c === "string" ? c : c.address)) : [cc];
      mailOptions.cc = ccList.join(", ");
    }

    if (bcc) {
      const bccList = Array.isArray(bcc) ? bcc.map((b) => (typeof b === "string" ? b : b.address)) : [bcc];
      mailOptions.bcc = bccList.join(", ");
    }

    if (inReplyTo) {
      mailOptions.inReplyTo = inReplyTo;
    }
    if (references) {
      mailOptions.references = references;
    }

    const sendResult = await transport.sendMail(mailOptions);

    const savedRecord = await EmailMessageModel.create({
      messageId: sendResult.messageId || `sent-${Date.now()}@local`,
      folder: "Sent",
      from: { name: fromName, address: fromAddress },
      to: toAddresses.map((addr) => ({ name: "", address: addr })),
      subject: mailOptions.subject,
      snippet: (bodyText || bodyHtml || "").replace(/<[^>]*>?/gm, "").slice(0, 160),
      bodyHtml: mailOptions.html,
      bodyText: mailOptions.text,
      date: new Date(),
      isRead: true,
      inReplyTo: inReplyTo || null,
      references: Array.isArray(references) ? references : references ? [references] : [],
      threadId: threadId || inReplyTo || sendResult.messageId,
      active: true,
    });

    return res.status(201).json({
      status: true,
      message: "Email sent successfully.",
      data: { ...savedRecord.toJSON(), id: savedRecord._id?.toString?.() },
    });
  } catch (err) {
    next(err);
  }
};

// Manually triggers on-demand IMAP synchronization for all folders
export const triggerManualSync = async (req, res, next) => {
  try {
    const result = await syncAllMailFolders(40);
    return res.json({
      status: true,
      message: "Mailbox synchronization completed.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// Toggles email read/starred/folder flags
export const updateMessageFlags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isRead, isStarred, folder } = req.body;

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }], active: true }
      : { did: id, active: true };

    const update = {};
    if (typeof isRead === "boolean") update.isRead = isRead;
    if (typeof isStarred === "boolean") update.isStarred = isStarred;
    if (folder && ["INBOX", "Sent", "Drafts", "Trash", "Spam", "Archive"].includes(folder)) {
      update.folder = folder;
    }

    const updated = await EmailMessageModel.findOneAndUpdate(filter, { $set: update }, { new: true });

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "Email message not found.",
      });
    }

    return res.json({
      status: true,
      message: "Message flags updated.",
      data: { ...updated.toJSON(), id: updated._id?.toString?.() },
    });
  } catch (err) {
    next(err);
  }
};

// Performs batch operations across multiple emails
export const batchWebmailAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Array of message IDs is required.",
      });
    }

    const objIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const dids = ids.filter((id) => !Types.ObjectId.isValid(id));
    const filter = {
      $or: [{ _id: { $in: objIds } }, { did: { $in: dids } }].filter(
        (c) => Object.values(c)[0].$in.length > 0
      ),
    };

    let update = {};
    if (action === "markRead") update = { isRead: true };
    else if (action === "markUnread") update = { isRead: false };
    else if (action === "star") update = { isStarred: true };
    else if (action === "unstar") update = { isStarred: false };
    else if (action === "trash") update = { folder: "Trash" };
    else if (action === "delete") update = { active: false };
    else {
      return res.status(400).json({
        status: false,
        message: "Invalid batch action specified.",
      });
    }

    await EmailMessageModel.updateMany(filter, { $set: update });

    return res.json({
      status: true,
      message: `${ids.length} messages updated successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

// Moves message to Trash folder or permanently soft deletes
export const deleteWebmailMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { did: id }] }
      : { did: id };

    const msg = await EmailMessageModel.findOne(filter);
    if (!msg) {
      return res.status(404).json({
        status: false,
        message: "Email message not found.",
      });
    }

    if (msg.folder !== "Trash") {
      msg.folder = "Trash";
      await msg.save();
    } else {
      msg.active = false;
      await msg.save();
    }

    return res.json({
      status: true,
      message: "Message moved to trash.",
    });
  } catch (err) {
    next(err);
  }
};

// Returns list of all mail folders with unread and total counters
export const getWebmailFolders = async (req, res, next) => {
  try {
    const [inboxUnread, inboxTotal, sentTotal, trashTotal, starredTotal, inquiriesUnread, inquiriesTotal] =
      await Promise.all([
        EmailMessageModel.countDocuments({ active: true, folder: "INBOX", isRead: false }),
        EmailMessageModel.countDocuments({ active: true, folder: "INBOX" }),
        EmailMessageModel.countDocuments({ active: true, folder: "Sent" }),
        EmailMessageModel.countDocuments({ active: true, folder: "Trash" }),
        EmailMessageModel.countDocuments({ active: true, isStarred: true }),
        ContactMessageModel.countDocuments({ active: true, status: "unread" }),
        ContactMessageModel.countDocuments({ active: true }),
      ]);

    return res.json({
      status: true,
      data: [
        { id: "INBOX", name: "Inbox", unread: inboxUnread, total: inboxTotal, icon: "Inbox" },
        { id: "Sent", name: "Sent", unread: 0, total: sentTotal, icon: "Send" },
        { id: "Starred", name: "Starred", unread: 0, total: starredTotal, icon: "Star" },
        { id: "Inquiries", name: "Website Inquiries", unread: inquiriesUnread, total: inquiriesTotal, icon: "MessageSquare" },
        { id: "Trash", name: "Trash", unread: 0, total: trashTotal, icon: "Trash2" },
      ],
    });
  } catch (err) {
    next(err);
  }
};
