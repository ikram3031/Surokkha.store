import { StoreSettingsModel } from "../models/storeSettings.model.js";
import { decryptText } from "../utils/crypto.util.js";
import { env } from "../config/env.js";

export const DEFAULT_BACKUP_CRON = "0 3 * * *";
export const DEFAULT_BACKUP_TIMEZONE = "Asia/Dhaka";

// Resolves the active R2 config: dashboard R2 Storage settings first, then environment variables
export const getR2Config = async () => {
  const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
  const r2 = doc?.r2Storage || {};
  const useDb = Boolean(r2.isEnabled && r2.accountId && r2.accessKeyId && r2.secretAccessKey && r2.bucketName);

  if (useDb) {
    return {
      source: "settings",
      accountId: r2.accountId,
      accessKeyId: r2.accessKeyId,
      secretAccessKey: decryptText(r2.secretAccessKey),
      bucketName: r2.bucketName,
      publicUrl: r2.publicUrl || "",
      backupEnabled: r2.backupEnabled ?? true,
      backupCron: r2.backupCron || DEFAULT_BACKUP_CRON,
      backupTimezone: r2.backupTimezone || DEFAULT_BACKUP_TIMEZONE,
      retentionDays: Number(r2.retentionDays) || 30,
    };
  }

  return {
    source: "env",
    accountId: env.R2_ACCOUNT_ID || "",
    accessKeyId: env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || "",
    bucketName: env.R2_BUCKET_NAME || "",
    publicUrl: env.R2_PUBLIC_URL || "",
    backupEnabled: env.R2_BACKUP_ENABLED,
    backupCron: DEFAULT_BACKUP_CRON,
    backupTimezone: env.R2_BACKUP_TIMEZONE || DEFAULT_BACKUP_TIMEZONE,
    retentionDays: env.R2_BACKUP_RETENTION_DAYS || 30,
  };
};

export const isR2Configured = (cfg) =>
  Boolean(cfg?.accountId && cfg?.accessKeyId && cfg?.secretAccessKey && cfg?.bucketName);

// Records the outcome of the latest backup run on the settings document
export const recordBackupStatus = async (status, message = "", size = "") => {
  await StoreSettingsModel.updateOne(
    { key: "default" },
    {
      $set: {
        "r2Storage.lastBackupStatus": status,
        "r2Storage.lastBackupMessage": String(message).slice(0, 500),
        ...(status !== "running" ? { "r2Storage.lastBackupAt": new Date(), "r2Storage.lastBackupSize": size } : {}),
      },
    },
    { upsert: true }
  );
};
