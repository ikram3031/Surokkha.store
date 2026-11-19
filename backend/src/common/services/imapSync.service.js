import mongoose from "mongoose";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { logger } from "../config/logger.js";
import { EmailMessageModel } from "../models/emailMessage.model.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { decryptText } from "../utils/crypto.util.js";
import { broadcastWebmailUnread } from "../utils/webmailUnread.js";
import { getSmtpTransport } from "./smtpConfig.service.js";

let isSyncing = false;
let idleClient = null;
let idleLock = null;
let reconnectTimer = null;
let isIntentionalStop = false;
let idleGeneration = 0;

// Reads the single active IMAP configuration strictly from the database ("default" document)
const getDbImapConfig = async () => {
  if (mongoose.connection.readyState !== 1) return null;
  const doc = await StoreSettingsModel.findOne({ key: "default" }).select("imap").lean();
  const dbImap = doc?.imap || {};
  const host = String(dbImap.host || "").trim();
  const user = String(dbImap.user || "").trim();
  const pass = dbImap.password ? String(decryptText(dbImap.password)).trim() : "";

  if (!dbImap.isEnabled || !host || !user || !pass) {
    return null;
  }

  return {
    host,
    port: Number(dbImap.port || 993),
    secure: dbImap.secure !== false,
    user,
    pass,
    forwardEmails: Array.isArray(dbImap.forwardEmails) ? dbImap.forwardEmails : [],
  };
};

// Returns whether the single Webmail IMAP account is enabled and complete in the database
export const isImapConfigured = async () => Boolean(await getDbImapConfig());

// Single unified mailbox: match all existing EmailMessage docs regardless of legacy mailbox tag
export const mailboxFilter = () => ({});

// Creates a new configured ImapFlow client instance from database settings
const createImapClient = async () => {
  const imap = await getDbImapConfig();
  if (!imap) {
    throw new Error("IMAP is not enabled or configured in database");
  }

  return new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: imap.secure,
    auth: {
      user: imap.user,
      pass: imap.pass,
    },
    logger: false,
    emitLogs: false,
  });
};

// Normalizes email addresses array from mailparser format
const normalizeAddresses = (addressObject) => {
  if (!addressObject) return [];
  const list = addressObject.value || [];
  return list.map((item) => ({
    name: item.name || "",
    address: (item.address || "").toLowerCase().trim(),
  }));
};

// Identifies automated bounce notices, delivery failure reports, and mailer-daemons
const isBounceOrDaemonNotification = (fromAddress = "", subject = "") => {
  const normalizedFrom = String(fromAddress || "").toLowerCase();
  const normalizedSub = String(subject || "").toLowerCase();
  return (
    normalizedFrom.includes("mailer-daemon") ||
    normalizedFrom.includes("postmaster") ||
    normalizedSub.includes("undelivered mail") ||
    normalizedSub.includes("delivery status notification") ||
    normalizedSub.includes("failure notice")
  );
};

// Parses a single MIME message stream and saves or updates it in MongoDB
const parseAndSaveMessage = async (msgSource, uid, folder, flags = []) => {
  try {
    const parsed = await simpleParser(msgSource);

    const fromList = normalizeAddresses(parsed.from);
    const from = fromList[0] || { name: "", address: "unknown@example.com" };
    const to = normalizeAddresses(parsed.to);
    const cc = normalizeAddresses(parsed.cc);
    const bcc = normalizeAddresses(parsed.bcc);
    const replyTo = normalizeAddresses(parsed.replyTo);

    const messageId = parsed.messageId || `uid-${uid}-${folder}@local`;
    const subject = parsed.subject || "(No Subject)";
    const bodyHtml = parsed.html || (parsed.text ? `<pre>${parsed.text}</pre>` : "");
    const bodyText = parsed.text || "";
    const snippet = (bodyText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const isRead = Array.isArray(flags) && flags.some((f) => String(f).toLowerCase().includes("seen"));
    const isStarred = Array.isArray(flags) && flags.some((f) => String(f).toLowerCase().includes("flagged"));

    const attachments = (parsed.attachments || []).map((att) => ({
      filename: att.filename || "attachment",
      contentType: att.contentType || "application/octet-stream",
      size: att.size || 0,
      cid: att.cid || null,
    }));

    const threadId = parsed.inReplyTo || messageId;

    const existingMsg = await EmailMessageModel.findOne({
      $or: [{ messageId }, { uid, folder }],
    });

    const isNewIncoming = !existingMsg && folder.toUpperCase() === "INBOX";

    const saved = await EmailMessageModel.findOneAndUpdate(
      { $or: [{ messageId }, { uid, folder }] },
      {
        $set: {
          mailbox: "shop",
          uid,
          messageId,
          folder,
          from,
          to,
          cc,
          bcc,
          replyTo,
          subject,
          snippet,
          bodyHtml,
          bodyText,
          date: parsed.date || new Date(),
          flags,
          isRead: existingMsg ? existingMsg.isRead : isRead,
          isStarred: existingMsg ? existingMsg.isStarred : isStarred,
          hasAttachments: attachments.length > 0,
          attachments,
          inReplyTo: parsed.inReplyTo || null,
          references: Array.isArray(parsed.references) ? parsed.references : [],
          threadId,
          active: true,
        },
      },
      { upsert: true, new: true }
    );

    // Webmail has no bell notification; the sidebar badge shows the Inbox unread count instead
    if (isNewIncoming) broadcastWebmailUnread();

    // System messages (e.g. deploy reports, inbox copies) carry X-Surokkha-System so they are never forwarded
    if (isNewIncoming && !isBounceOrDaemonNotification(from.address, subject) && !parsed.headers?.has("x-surokkha-system")) {
      try {
        const { transport: forwardTransport, config: smtp } = await getSmtpTransport();
        const senderMailbox = smtp.fromEmail || smtp.user;

        // Never forward our own mail, and never forward back into this mailbox, or it loops forever
        const ownAddresses = new Set(
          [smtp.user, smtp.fromEmail]
            .filter(Boolean)
            .map((addr) => String(addr).toLowerCase().trim())
        );
        // Forward targets come from the "Forward incoming mail to" field in the IMAP settings
        const settingsDoc = await StoreSettingsModel.findOne({ key: "default" }).select("imap").lean();
        if (settingsDoc?.imap?.user) ownAddresses.add(String(settingsDoc.imap.user).toLowerCase().trim());
        const forwardTarget = [...new Set(settingsDoc?.imap?.forwardEmails || [])]
          .map((addr) => String(addr).toLowerCase().trim())
          .filter((addr) => addr && !ownAddresses.has(addr));
        const isOwnOrForwarded =
          ownAddresses.has(String(from.address || "").toLowerCase()) ||
          /^\s*\[fwd:/i.test(subject) ||
          parsed.headers?.has("x-support-forwarded");

        if (forwardTarget.length && smtp.isConfigured && !isOwnOrForwarded) {
          forwardTransport.sendMail({
            from: smtp.fromAddress,
            to: forwardTarget,
            replyTo: from.address,
            headers: { "X-Support-Forwarded": "1" },
            subject: `[Fwd: ${senderMailbox}] ${subject}`,
            html: `
              <div style="font-family: -apple-system, sans-serif; padding: 15px; border-left: 4px solid #e11d48; background: #f8fafc; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Forwarded from ${senderMailbox}</strong></p>
                <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>From:</strong> ${from.name ? `${from.name} &lt;${from.address}&gt;` : from.address}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}</p>
              </div>
              <div>${bodyHtml || `<pre>${bodyText}</pre>`}</div>
            `,
          }).catch((fwdErr) => {
            logger.error({ fwdErr }, "Non-blocking support email forward error");
          });
        }
      } catch (logErr) {
        logger.error({ logErr }, "Error creating activity log for incoming email");
      }
    }

    return saved;
  } catch (err) {
    logger.error({ err, uid, folder }, "Error parsing MIME message stream");
    return null;
  }
};

// Synchronizes messages from a specific IMAP folder into the database
export const syncImapFolder = async (folderName = "INBOX", limit = 50) => {
  if (!(await isImapConfigured())) return { count: 0, skipped: true };

  let client;
  try {
    client = await createImapClient();
  } catch (err) {
    return { count: 0, error: err.message };
  }
  let processedCount = 0;

  try {
    await client.connect();

    const mailboxes = await client.list();
    const targetBox = mailboxes.find(
      (m) =>
        m.path.toUpperCase() === folderName.toUpperCase() ||
        (folderName.toUpperCase() === "SENT" && m.specialUse === "\\Sent") ||
        (folderName.toUpperCase() === "TRASH" && m.specialUse === "\\Trash")
    );

    const mailboxPath = targetBox ? targetBox.path : folderName;

    const lock = await client.getMailboxLock(mailboxPath);
    try {
      const status = client.mailbox;
      if (!status || status.exists === 0) {
        return { count: 0 };
      }

      const startSeq = Math.max(1, status.exists - limit + 1);
      const range = `${startSeq}:*`;

      for await (const message of client.fetch(range, {
        uid: true,
        flags: true,
        source: true,
      })) {
        if (message.source) {
          await parseAndSaveMessage(message.source, message.uid, folderName, Array.from(message.flags || []));
          processedCount += 1;
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { count: processedCount, folder: folderName };
  } catch (err) {
    logger.error({ err, folder: folderName }, "IMAP folder synchronization error");
    try {
      await client.logout();
    } catch {
    }
    return { count: 0, error: err.message };
  }
};

// Synchronizes INBOX and Sent folders for the single configured IMAP mailbox
export const syncAllMailFolders = async (limit = 50) => {
  if (isSyncing) return { status: "already_syncing" };
  isSyncing = true;

  try {
    let inboxResult = { count: 0, skipped: true };
    let sentResult = { count: 0, skipped: true };

    if (await isImapConfigured()) {
      inboxResult = await syncImapFolder("INBOX", limit);
      sentResult = await syncImapFolder("Sent", Math.min(25, limit));
    }

    return {
      success: true,
      inbox: inboxResult,
      sent: sentResult,
    };
  } finally {
    isSyncing = false;
  }
};

// Stops the active IMAP IDLE listener and cancels any pending reconnect timer
export const stopImapIdleListener = async () => {
  idleGeneration += 1;
  isIntentionalStop = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const lock = idleLock;
  const client = idleClient;
  idleLock = null;
  idleClient = null;

  if (lock) {
    try {
      lock.release();
    } catch {
    }
  }

  if (client) {
    try {
      await Promise.race([
        client.logout().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
    }
    try {
      client.close();
    } catch {
    }
  }
};

// Starts real-time IMAP IDLE listener on the INBOX folder using DB settings
export const startImapIdleListener = async () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  isIntentionalStop = false;
  idleGeneration += 1;
  const myGeneration = idleGeneration;

  if (!(await isImapConfigured())) {
    return;
  }

  await syncAllMailFolders(40).catch((err) => logger.warn({ err: err.message }, "Initial IMAP sync failed"));

  if (isIntentionalStop || myGeneration !== idleGeneration) {
    return;
  }

  if (idleClient) {
    const prevLock = idleLock;
    const prevClient = idleClient;
    idleLock = null;
    idleClient = null;
    if (prevLock) {
      try {
        prevLock.release();
      } catch {
      }
    }
    try {
      await Promise.race([
        prevClient.logout().catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      prevClient.close();
    } catch {
    }
  }

  let client;
  try {
    client = await createImapClient();
  } catch (err) {
    logger.warn({ err: err.message }, "IMAP listener not started");
    return;
  }

  idleClient = client;

  try {
    await client.connect();
    logger.info("Connected to IMAP server successfully");

    if (isIntentionalStop || myGeneration !== idleGeneration) {
      try {
        await client.logout();
      } catch {
      }
      return;
    }

    const lock = await client.getMailboxLock("INBOX");
    idleLock = lock;

    if (isIntentionalStop || myGeneration !== idleGeneration) {
      try {
        lock.release();
      } catch {
      }
      try {
        await client.logout();
      } catch {
      }
      return;
    }

    client.on("exists", async (data) => {
      if (isIntentionalStop || myGeneration !== idleGeneration) return;
      logger.info({ count: data.count }, "New email event detected via IMAP IDLE");
      try {
        await syncImapFolder("INBOX", 10);
      } catch (syncErr) {
        logger.error({ syncErr }, "Error syncing newly detected email in IDLE");
      }
    });

    client.on("flags", async () => {
      if (isIntentionalStop || myGeneration !== idleGeneration) return;
      try {
        await syncImapFolder("INBOX", 10);
      } catch {
      }
    });

    client.on("close", () => {
      try {
        lock.release();
      } catch {
      }
      if (idleClient === client) {
        idleClient = null;
        idleLock = null;
      }
      if (!isIntentionalStop && myGeneration === idleGeneration) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          if (!isIntentionalStop && myGeneration === idleGeneration) {
            startImapIdleListener().catch(() => {});
          }
        }, 15000);
      }
    });

    client.on("error", (err) => {
      logger.error({ err }, "IMAP client connection error");
    });
  } catch (err) {
    if (idleClient === client) {
      idleClient = null;
      idleLock = null;
    }
    try {
      client.close();
    } catch {
    }
    logger.error({ err: err.message }, "Failed to start IMAP IDLE listener, will retry in 30s");
    if (!isIntentionalStop && myGeneration === idleGeneration) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!isIntentionalStop && myGeneration === idleGeneration) {
          startImapIdleListener().catch(() => {});
        }
      }, 30000);
    }
  }
};

// Hot-reloads the IMAP IDLE listener immediately after settings changes
export const restartImapIdleListener = async () => {
  await stopImapIdleListener();
  if (await isImapConfigured()) {
    await startImapIdleListener();
  } else {
    logger.info("IMAP is disabled or incomplete; IDLE listener stopped");
  }
};

// Appends a raw MIME message directly into the IMAP INBOX as unread, then syncs it
export const appendEmailToInbox = async (rawMimeBuffer) => {
  if (!(await isImapConfigured())) return false;

  let client;
  try {
    client = await createImapClient();
    await client.connect();
    await client.append("INBOX", rawMimeBuffer, []);
    await client.logout();
  } catch (err) {
    logger.error({ err }, "Error appending email to IMAP INBOX");
    try {
      if (client) await client.logout();
    } catch {
    }
    return false;
  }
  await syncImapFolder("INBOX", 10).catch((err) => logger.warn({ err: err.message }, "INBOX sync after append failed"));
  return true;
};

// Appends a raw MIME message sent via Webmail into the IMAP Sent folder
export const appendEmailToSentFolder = async (rawMimeBuffer) => {
  if (!(await isImapConfigured())) return false;

  let client;
  try {
    client = await createImapClient();
    await client.connect();

    const mailboxes = await client.list();
    const sentBox = mailboxes.find(
      (m) => m.path.toUpperCase() === "SENT" || m.specialUse === "\\Sent"
    );

    const folderPath = sentBox ? sentBox.path : "Sent";

    await client.append(folderPath, rawMimeBuffer, ["\\Seen"]);
    await client.logout();
    return true;
  } catch (err) {
    logger.error({ err }, "Error appending email to IMAP Sent folder");
    try {
      if (client) await client.logout();
    } catch {
    }
    return false;
  }
};
