import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { EmailMessageModel } from "../models/emailMessage.model.js";
import { LogModel } from "../models/log.model.js";
import { broadcastLiveNotification } from "../websocket.js";

let isSyncing = false;
let idleClient = null;

// Creates a new configured ImapFlow client instance
const createImapClient = () => {
  const user = env.IMAP_USER || env.SMTP_USER;
  const pass = env.IMAP_PASSWORD || env.SMTP_PASSWORD;
  return new ImapFlow({
    host: env.IMAP_HOST,
    port: env.IMAP_PORT,
    secure: env.IMAP_SECURE,
    auth: {
      user,
      pass,
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

    // If new email arrived in INBOX, trigger live WebSocket notification and forward
    if (isNewIncoming && !isBounceOrDaemonNotification(from.address, subject)) {
      try {
        const senderName = from.name || from.address;
        const log = await LogModel.create({
          type: "webmailMessage",
          typeDid: "113",
          description: `New email from ${senderName}: "${subject.slice(0, 45)}"`,
          readStatus: false,
          active: true,
          createdBy: "webmail-sync",
          updatedBy: "webmail-sync",
        });

        broadcastLiveNotification(log).catch((wsErr) => {
          logger.error({ wsErr }, "WebSocket broadcast error on incoming webmail");
        });

        // Forward incoming support email to designated forward address (plexivia@gmail.com)
        const forwardTarget = process.env.SUPPORT_FORWARD_EMAIL || "plexivia@gmail.com";
        if (forwardTarget && env.SMTP_USER) {
          const isSecure =
            Number(env.SMTP_PORT) === 465 ||
            String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl";

          const isLocalhost = env.SMTP_HOST === "127.0.0.1" || env.SMTP_HOST === "localhost";
          const hasAuth = !isLocalhost && env.SMTP_PASSWORD && env.SMTP_PASSWORD !== "none" && env.SMTP_USER;

          const transportConfig = {
            host: env.SMTP_HOST,
            port: Number(env.SMTP_PORT),
            secure: isSecure,
            tls: { rejectUnauthorized: false },
          };

          if (hasAuth) {
            transportConfig.auth = { user: env.SMTP_USER, pass: env.SMTP_PASSWORD };
          }

          const forwardTransport = nodemailer.createTransport(transportConfig);

          forwardTransport.sendMail({
            from: {
              name: env.SMTP_FROM_NAME || "Surokkha Support",
              address: env.SMTP_FROM || env.SMTP_USER,
            },
            to: forwardTarget,
            replyTo: from.address,
            subject: `[Fwd: support@surokkha.store] ${subject}`,
            html: `
              <div style="font-family: -apple-system, sans-serif; padding: 15px; border-left: 4px solid #e11d48; background: #f8fafc; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Forwarded from support@surokkha.store</strong></p>
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
export const syncImapFolder = async (folderName = "INBOX", limit = 50) => {
  if (!env.IMAP_SYNC_ENABLED) return { count: 0 };

  const client = createImapClient();
  let processedCount = 0;

  try {
    await client.connect();

    // Check if folder exists
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

      // Fetch latest messages in reverse
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
      // silent
    }
    return { count: 0, error: err.message };
  }
};

// Synchronizes both INBOX and Sent mail folders
export const syncAllMailFolders = async (limit = 50) => {
  if (isSyncing) return { status: "already_syncing" };
  isSyncing = true;

  try {
    const inboxResult = await syncImapFolder("INBOX", limit);
    const sentResult = await syncImapFolder("Sent", Math.min(25, limit));

    return {
      success: true,
      inbox: inboxResult,
      sent: sentResult,
    };
  } finally {
    isSyncing = false;
  }
};

// Starts real-time IMAP IDLE listener on the INBOX folder
export const startImapIdleListener = async () => {
  if (!env.IMAP_SYNC_ENABLED) return;
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) return;

  if (idleClient) {
    try {
      await idleClient.logout();
    } catch {
      // silent
    }
  }

  const client = createImapClient();
  idleClient = client;

  try {
    await client.connect();
    logger.info({ host: env.IMAP_HOST, user: env.IMAP_USER || env.SMTP_USER }, "Connected to IMAP server successfully");

    // Perform initial synchronization
    await syncAllMailFolders(40);

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
        // silent
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

// Appends an outgoing email buffer into the IMAP Sent folder
export const appendEmailToSentFolder = async (rawMimeBuffer) => {
  if (!env.IMAP_SYNC_ENABLED) return;

  const client = createImapClient();
  try {
    await client.connect();

    const mailboxes = await client.list();
    const sentBox = mailboxes.find(
      (m) => m.path.toUpperCase() === "SENT" || m.specialUse === "\\Sent"
    );

    const folderPath = sentBox ? sentBox.path : "Sent";

    await client.append(folderPath, rawMimeBuffer, ["\\Seen"]);
    await client.logout();
  } catch (err) {
    logger.error({ err }, "Error appending email to IMAP Sent folder");
    try {
      await client.logout();
    } catch {
      // silent
    }
  }
};
