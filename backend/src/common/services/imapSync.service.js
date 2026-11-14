import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { env } from "../config/env.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";
import { EmailMessageModel } from "../models/emailMessage.model.js";
import { LogModel } from "../models/log.model.js";
import { broadcastLiveNotification } from "../websocket.js";
import { getSmtpTransport } from "./smtpConfig.service.js";

let isSyncing = false;
let idleClient = null;

import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { decryptText } from "../utils/crypto.util.js";

// Store mailbox (support@surokkha.store): IMAP login from the store's own SMTP settings, same mail host
const storeImapSettings = async () => {
  const doc = await StoreSettingsModel.findOne({ key: "store-smtp" }).lean();
  const smtp = doc?.smtp || {};
  const imap = doc?.imap || {};
  if (imap.isEnabled && imap.host && imap.user && imap.password) {
    return { host: imap.host, port: imap.port || 993, secure: imap.secure !== false, user: imap.user, pass: decryptText(imap.password) };
  }
  if (!smtp.isEnabled || !smtp.host || !smtp.user || !smtp.password) return null;
  return { host: String(smtp.host).replace(/^smtp\./i, "imap."), port: 993, secure: true, user: smtp.user, pass: decryptText(smtp.password) };
};

// Is the store mailbox set up (store SMTP on and complete)?
export const isStoreMailboxConfigured = async () => Boolean(await storeImapSettings());

// Is the shop mailbox set up in the database?
export const isShopMailboxConfigured = async () => {
  const doc = await StoreSettingsModel.findOne({ key: "default" }).select("imap").lean();
  const dbImap = doc?.imap || {};
  return Boolean(dbImap.isEnabled && dbImap.host && dbImap.user && dbImap.password);
};

// Mailbox filter: older messages have no mailbox field and belong to the shop mailbox
export const mailboxFilter = (mailbox) => (mailbox === "store" ? { mailbox: "store" } : { mailbox: { $in: ["shop", null] } });

// Creates a new configured ImapFlow client instance from database settings
const createImapClient = async (mailbox = "shop") => {
  if (mailbox === "store") {
    const s = await storeImapSettings();
    if (!s) throw new Error("Store mailbox is not configured");
    return new ImapFlow({ host: s.host, port: s.port, secure: s.secure, auth: { user: s.user, pass: s.pass }, logger: false, emitLogs: false });
  }
  const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
  const dbImap = doc?.imap || {};
  if (!dbImap.isEnabled || !dbImap.host || !dbImap.user || !dbImap.password) {
    throw new Error("Shop IMAP is not configured in database");
  }

  return new ImapFlow({
    host: dbImap.host,
    port: dbImap.port || 993,
    secure: dbImap.secure !== false,
    auth: {
      user: dbImap.user,
      pass: decryptText(dbImap.password),
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
const parseAndSaveMessage = async (msgSource, uid, folder, flags = [], mailbox = "shop") => {
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

    const scope = mailboxFilter(mailbox);
    const existingMsg = await EmailMessageModel.findOne({
      ...scope,
      $or: [{ messageId }, { uid, folder }],
    });

    const isNewIncoming = !existingMsg && folder.toUpperCase() === "INBOX";

    const saved = await EmailMessageModel.findOneAndUpdate(
      { ...scope, $or: [{ messageId }, { uid, folder }] },
      {
        $set: {
          mailbox,
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

    // System reports (deploy) carry X-Surokkha-System and post their own notification, so no second bell or forward
    if (isNewIncoming && !isBounceOrDaemonNotification(from.address, subject) && !parsed.headers?.has("x-surokkha-system")) {
      try {
        const senderName = from.name || from.address;
        const log = await LogModel.create({
          type: "webmailMessage",
          typeDid: "113",
          description: `${mailbox === "store" ? "[surokkha.store] " : ""}New email from ${senderName}: "${subject.slice(0, 45)}"`,
          readStatus: false,
          active: true,
          createdBy: "webmail-sync",
          updatedBy: "webmail-sync",
        });

        broadcastLiveNotification(log).catch((wsErr) => {
          logger.error({ wsErr }, "WebSocket broadcast error on incoming webmail");
        });

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

        if (mailbox === "shop" && forwardTarget.length && smtp.isConfigured && !isOwnOrForwarded) {
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
                <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</p>
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
export const syncImapFolder = async (folderName = "INBOX", limit = 50, mailbox = "shop") => {
  if (!env.IMAP_SYNC_ENABLED) return { count: 0 };

  let client;
  try {
    client = await createImapClient(mailbox);
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
          await parseAndSaveMessage(message.source, message.uid, folderName, Array.from(message.flags || []), mailbox);
          processedCount += 1;
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return { count: processedCount, folder: folderName };
  } catch (err) {
    logger.error({ err, folder: folderName, mailbox }, "IMAP folder synchronization error");
    try {
      await client.logout();
    } catch {
    }
    return { count: 0, error: err.message };
  }
};

// Synchronizes both INBOX and Sent mail folders for configured mailboxes
export const syncAllMailFolders = async (limit = 50) => {
  if (isSyncing) return { status: "already_syncing" };
  isSyncing = true;

  try {
    let inboxResult = { count: 0, skipped: true };
    let sentResult = { count: 0, skipped: true };
    if (await isShopMailboxConfigured()) {
      inboxResult = await syncImapFolder("INBOX", limit, "shop");
      sentResult = await syncImapFolder("Sent", Math.min(25, limit), "shop");
    }
    // The surokkha.store support@ mailbox, when its SMTP/IMAP is set up
    let store = null;
    if (await isStoreMailboxConfigured()) {
      store = {
        inbox: await syncImapFolder("INBOX", limit, "store"),
        sent: await syncImapFolder("Sent", Math.min(25, limit), "store"),
      };
    }

    return {
      success: true,
      inbox: inboxResult,
      sent: sentResult,
      store,
    };
  } finally {
    isSyncing = false;
  }
};

// The store mailbox has no IDLE connection of its own: its INBOX is checked every 2 minutes
let storePollTimer = null;
const startStoreMailboxPolling = () => {
  if (storePollTimer) return;
  storePollTimer = setInterval(async () => {
    try {
      if (await isStoreMailboxConfigured()) await syncImapFolder("INBOX", 15, "store");
    } catch (err) {
      logger.warn({ err: err.message }, "Store mailbox poll failed");
    }
  }, 2 * 60 * 1000);
};

// Starts real-time IMAP IDLE listener on the INBOX folder (and store mailbox polling)
export const startImapIdleListener = async () => {
  if (!env.IMAP_SYNC_ENABLED) return;

  await syncAllMailFolders(40).catch((err) => logger.warn({ err: err.message }, "Initial IMAP sync failed"));
  startStoreMailboxPolling();

  if (!(await isShopMailboxConfigured())) return;

  if (idleClient) {
    try {
      await idleClient.logout();
    } catch {
    }
  }

  const client = await createImapClient("shop");
  idleClient = client;

  try {
    await client.connect();
    logger.info("Connected to shop IMAP server successfully");

    const lock = await client.getMailboxLock("INBOX");

    client.on("exists", async (data) => {
      logger.info({ count: data.count }, "New email event detected via IMAP IDLE");
      try {
        await syncImapFolder("INBOX", 10);
      } catch (syncErr) {
        logger.error({ syncErr }, "Error syncing newly detected email in IDLE");
      }
    });

    client.on("flags", async () => {
      try {
        await syncImapFolder("INBOX", 10);
      } catch {
      }
    });

    client.on("close", () => {
      lock.release();
      setTimeout(() => {
        startImapIdleListener().catch(() => {});
      }, 15000);
    });

    client.on("error", (err) => {
      logger.error({ err }, "IMAP client connection error");
    });
  } catch (err) {
    logger.error({ err: err.message }, "Failed to start IMAP IDLE listener, will retry in 30s");
    setTimeout(() => {
      startImapIdleListener().catch(() => {});
    }, 30000);
  }
};

// Appends an outgoing email buffer into the IMAP INBOX folder
// Drops a system message (e.g. a deploy report) straight into the Webmail INBOX as unread, then syncs
// it so it shows at once. Used instead of SMTP because the store mailbox never mails itself.
export const appendEmailToInbox = async (rawMimeBuffer, mailbox = "shop") => {
  if (!env.IMAP_SYNC_ENABLED) return false;
  let client;
  try {
    client = await createImapClient(mailbox);
    await client.connect();
    await client.append("INBOX", rawMimeBuffer, []);
    await client.logout();
  } catch (err) {
    logger.error({ err, mailbox }, "Error appending email to IMAP INBOX");
    try {
      if (client) await client.logout();
    } catch {
    }
    return false;
  }
  await syncImapFolder("INBOX", 10, mailbox).catch((err) => logger.warn({ err: err.message }, "INBOX sync after append failed"));
  return true;
};

export const appendEmailToSentFolder = async (rawMimeBuffer, mailbox = "shop") => {
  if (!env.IMAP_SYNC_ENABLED) return;

  let client;
  try {
    client = await createImapClient(mailbox);
    await client.connect();

    const mailboxes = await client.list();
    const sentBox = mailboxes.find(
      (m) => m.path.toUpperCase() === "SENT" || m.specialUse === "\\Sent"
    );

    const folderPath = sentBox ? sentBox.path : "Sent";

    await client.append(folderPath, rawMimeBuffer, ["\\Seen"]);
    await client.logout();
  } catch (err) {
    logger.error({ err, mailbox }, "Error appending email to IMAP Sent folder");
    try {
      if (client) await client.logout();
    } catch {
    }
  }
};
