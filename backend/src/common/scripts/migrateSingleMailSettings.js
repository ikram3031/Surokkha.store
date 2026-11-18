// One-time migration: consolidates legacy "store-smtp" settings into "default" and normalizes
// EmailMessage.mailbox ("store" / null / missing) into "shop" for unified single-mailbox Webmail.
//
// Usage:
//   node src/common/scripts/migrateSingleMailSettings.js --dry-run
//   node src/common/scripts/migrateSingleMailSettings.js
import mongoose from "mongoose";
import { connectDatabase, closeDatabase } from "../database/index.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { EmailMessageModel } from "../models/emailMessage.model.js";

const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("--dry");
const PREFERRED_SUPPORT_MAILBOX = "support@surokkha.store";

const sanitizeSettingsSummary = (doc) => {
  if (!doc) return null;
  return {
    key: doc.key,
    smtp: doc.smtp
      ? {
          host: doc.smtp.host || "",
          port: doc.smtp.port || null,
          secure: doc.smtp.secure ?? null,
          user: doc.smtp.user || "",
          hasPassword: Boolean(doc.smtp.password),
          senderName: doc.smtp.senderName || "",
          senderEmail: doc.smtp.senderEmail || "",
          isEnabled: Boolean(doc.smtp.isEnabled),
        }
      : null,
    imap: doc.imap
      ? {
          host: doc.imap.host || "",
          port: doc.imap.port || null,
          secure: doc.imap.secure ?? null,
          user: doc.imap.user || "",
          hasPassword: Boolean(doc.imap.password),
          isEnabled: Boolean(doc.imap.isEnabled),
          forwardEmails: Array.isArray(doc.imap.forwardEmails) ? doc.imap.forwardEmails : [],
        }
      : null,
  };
};

const run = async () => {
  console.log(`[migrateSingleMailSettings] Starting (${isDryRun ? "DRY RUN" : "LIVE"})...`);
  await connectDatabase();

  const [defaultDoc, storeSmtpDoc] = await Promise.all([
    StoreSettingsModel.findOne({ key: "default" }).lean(),
    StoreSettingsModel.findOne({ key: "store-smtp" }).lean(),
  ]);

  console.log("Current default settings:", JSON.stringify(sanitizeSettingsSummary(defaultDoc), null, 2));
  console.log("Current store-smtp settings:", JSON.stringify(sanitizeSettingsSummary(storeSmtpDoc), null, 2));

  if (storeSmtpDoc) {
    const storeImap = storeSmtpDoc.imap || {};
    const storeImapUser = String(storeImap.user || "").trim().toLowerCase();
    const defaultImap = defaultDoc?.imap || {};
    const defaultImapUser = String(defaultImap.user || "").trim().toLowerCase();

    const shouldCopyImap =
      Boolean(storeImapUser) &&
      (storeImapUser === PREFERRED_SUPPORT_MAILBOX ||
        !defaultImapUser ||
        defaultImapUser !== PREFERRED_SUPPORT_MAILBOX);

    const preservedForwardEmails =
      Array.isArray(defaultImap.forwardEmails) && defaultImap.forwardEmails.length > 0
        ? defaultImap.forwardEmails
        : Array.isArray(storeImap.forwardEmails)
          ? storeImap.forwardEmails
          : [];

    if (isDryRun) {
      console.log("[DRY RUN] Would back up store-smtp document to MongoDB collection 'store_settings_backups'.");
      if (shouldCopyImap) {
        console.log(
          `[DRY RUN] Would copy store-smtp.imap (user=${storeImap.user}) into default.imap (preserving ${preservedForwardEmails.length} forwardEmails).`
        );
      } else {
        console.log("[DRY RUN] Would keep existing default.imap unchanged.");
      }
      console.log("[DRY RUN] Would delete StoreSettings document with key='store-smtp'.");
    } else {
      await mongoose.connection.collection("store_settings_backups").insertOne({
        originalKey: "store-smtp",
        backedUpAt: new Date(),
        source: "migrateSingleMailSettings",
        document: storeSmtpDoc,
      });
      console.log("Backed up store-smtp document to MongoDB collection 'store_settings_backups'.");

      if (shouldCopyImap) {
        const nextImap = {
          "imap.host": storeImap.host || "",
          "imap.port": Number(storeImap.port || 993),
          "imap.secure": storeImap.secure !== false,
          "imap.user": storeImap.user || "",
          "imap.password": storeImap.password || "",
          "imap.isEnabled": Boolean(storeImap.isEnabled),
          "imap.forwardEmails": preservedForwardEmails,
        };
        await StoreSettingsModel.findOneAndUpdate(
          { key: "default" },
          { $set: nextImap },
          { upsert: true, setDefaultsOnInsert: true }
        );
        console.log(`Copied store-smtp.imap (user=${storeImap.user}) into default.imap.`);
      } else {
        console.log("Kept existing default.imap unchanged.");
      }

      const deleteResult = await StoreSettingsModel.deleteOne({ key: "store-smtp" });
      console.log(`Deleted store-smtp settings document (deletedCount=${deleteResult.deletedCount}).`);
    }
  } else {
    console.log("No 'store-smtp' settings document found; nothing to migrate or delete.");
  }

  const mailboxQuery = {
    $or: [{ mailbox: "store" }, { mailbox: null }, { mailbox: { $exists: false } }],
  };
  const legacyCount = await EmailMessageModel.countDocuments(mailboxQuery);
  console.log(`EmailMessage docs needing mailbox normalization ('store'/null/missing -> 'shop'): ${legacyCount}`);

  if (legacyCount > 0) {
    if (isDryRun) {
      console.log(`[DRY RUN] Would update ${legacyCount} EmailMessage docs to mailbox='shop'.`);
    } else {
      const updateResult = await EmailMessageModel.updateMany(mailboxQuery, { $set: { mailbox: "shop" } });
      console.log(`Normalized EmailMessage docs: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}.`);
    }
  }

  await closeDatabase();
  console.log("[migrateSingleMailSettings] Done.");
};

run().catch(async (err) => {
  console.error("[migrateSingleMailSettings] Migration failed:", err);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
