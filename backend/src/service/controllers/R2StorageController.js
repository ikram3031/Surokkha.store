import { Cron } from "croner";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { StoreSettingsModel } from "../../common/models/storeSettings.model.js";
import { encryptText, decryptText } from "../../common/utils/crypto.util.js";
import { DEFAULT_BACKUP_CRON, DEFAULT_BACKUP_TIMEZONE } from "../../common/services/r2Config.service.js";
import { executeR2Backup, isBackupRunning } from "../../common/services/r2Backup.service.js";
import { scheduleBackupJob, getNextBackupRun } from "../../common/schedulers/backupScheduler.js";
import { getR2Config, isR2Configured } from "../../common/services/r2Config.service.js";
import { listDatabaseBackups, planRetention, getBackupObject } from "../../common/services/r2BackupHistory.service.js";

const maskString = (str) => {
  if (!str) return "";
  if (str.length <= 8) return "********";
  return `********${str.slice(-4)}`;
};

// Public-safe view of the R2 settings: the secret is never returned, only whether one is saved
const toResponse = (r2 = {}) => ({
  isEnabled: r2.isEnabled ?? false,
  accountId: r2.accountId || "",
  accessKeyId: r2.accessKeyId || "",
  hasSecretAccessKey: Boolean(r2.secretAccessKey),
  secretAccessKeyMasked: r2.secretAccessKey ? maskString(decryptText(r2.secretAccessKey)) : "",
  bucketName: r2.bucketName || "",
  publicUrl: r2.publicUrl || "",
  backupEnabled: r2.backupEnabled ?? true,
  backupCron: r2.backupCron || DEFAULT_BACKUP_CRON,
  backupTimezone: r2.backupTimezone || DEFAULT_BACKUP_TIMEZONE,
  keepDailyDays: r2.keepDailyDays ?? 7,
  keepWeeklyWeeks: r2.keepWeeklyWeeks ?? 5,
  lastTestedAt: r2.lastTestedAt || null,
  lastTestStatus: r2.lastTestStatus || "untested",
  lastTestMessage: r2.lastTestMessage || "",
  lastBackupAt: r2.lastBackupAt || null,
  lastBackupStatus: isBackupRunning() ? "running" : r2.lastBackupStatus || "never",
  lastBackupMessage: r2.lastBackupMessage || "",
  lastBackupSize: r2.lastBackupSize || "",
  nextBackupAt: getNextBackupRun(),
});

const loadR2 = async () => (await StoreSettingsModel.findOne({ key: "default" }).lean())?.r2Storage || {};

// GET /settings/r2-storage
export const getR2StorageSettings = async (req, res, next) => {
  try {
    return res.json({ status: "success", data: toResponse(await loadR2()) });
  } catch (error) {
    next(error);
  }
};

// PUT /settings/r2-storage — an empty secret keeps the stored one
export const updateR2StorageSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const backupCron = String(body.backupCron || DEFAULT_BACKUP_CRON).trim();
    const backupTimezone = String(body.backupTimezone || DEFAULT_BACKUP_TIMEZONE).trim();
    try {
      new Cron(backupCron, { timezone: backupTimezone, paused: true }).stop();
    } catch (err) {
      return res.status(400).json({ status: "error", message: `Invalid schedule: ${err.message}` });
    }

    const keepDailyDays = Math.max(1, Math.min(60, parseInt(body.keepDailyDays ?? 7, 10) || 7));
    const keepWeeklyWeeks = Math.max(0, Math.min(52, parseInt(body.keepWeeklyWeeks ?? 5, 10) || 0));
    const update = {
      "r2Storage.isEnabled": Boolean(body.isEnabled),
      "r2Storage.accountId": String(body.accountId || "").trim(),
      "r2Storage.accessKeyId": String(body.accessKeyId || "").trim(),
      "r2Storage.bucketName": String(body.bucketName || "").trim(),
      "r2Storage.publicUrl": String(body.publicUrl || "").trim(),
      "r2Storage.backupEnabled": body.backupEnabled !== false,
      "r2Storage.backupCron": backupCron,
      "r2Storage.backupTimezone": backupTimezone,
      "r2Storage.keepDailyDays": keepDailyDays,
      "r2Storage.keepWeeklyWeeks": keepWeeklyWeeks,
      updatedBy: req.user?.userId || null,
    };
    const secret = String(body.secretAccessKey || "").trim();
    if (secret) update["r2Storage.secretAccessKey"] = encryptText(secret);
    if (body.clearSecret === true) update["r2Storage.secretAccessKey"] = "";

    const doc = await StoreSettingsModel.findOneAndUpdate(
      { key: "default" },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    await scheduleBackupJob();
    return res.json({ status: "success", message: "R2 storage settings saved.", data: toResponse(doc.r2Storage) });
  } catch (error) {
    next(error);
  }
};

// POST /settings/r2-storage/test — checks the bucket is reachable with the given (or stored) credentials
export const testR2StorageConnection = async (req, res, next) => {
  try {
    const stored = await loadR2();
    const body = req.body || {};
    const cfg = {
      accountId: String(body.accountId || stored.accountId || "").trim(),
      accessKeyId: String(body.accessKeyId || stored.accessKeyId || "").trim(),
      secretAccessKey: String(body.secretAccessKey || "").trim() || decryptText(stored.secretAccessKey || ""),
      bucketName: String(body.bucketName || stored.bucketName || "").trim(),
    };
    if (!cfg.accountId || !cfg.accessKeyId || !cfg.secretAccessKey || !cfg.bucketName) {
      return res.status(400).json({ status: "error", message: "Account ID, access key, secret and bucket are required." });
    }

    let ok = false;
    let message = "";
    try {
      const client = new S3Client({
        region: "auto",
        endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
      });
      await client.send(new HeadBucketCommand({ Bucket: cfg.bucketName }));
      ok = true;
      message = `Connected to bucket '${cfg.bucketName}'.`;
    } catch (err) {
      const code = err?.$metadata?.httpStatusCode;
      message =
        code === 403 ? "Access denied: check the access key, secret and that the token can use this bucket."
        : code === 404 ? `Bucket '${cfg.bucketName}' was not found in this account.`
        : err.message || "Connection failed.";
    }

    await StoreSettingsModel.updateOne(
      { key: "default" },
      { $set: { "r2Storage.lastTestedAt": new Date(), "r2Storage.lastTestStatus": ok ? "connected" : "failed", "r2Storage.lastTestMessage": message } },
      { upsert: true }
    );
    return res.status(ok ? 200 : 400).json({ status: ok ? "success" : "error", message });
  } catch (error) {
    next(error);
  }
};

// POST /settings/r2-storage/backup-now — starts a backup in the background; poll GET for the result
export const runR2BackupNow = async (req, res, next) => {
  try {
    if (isBackupRunning()) {
      return res.status(409).json({ status: "error", message: "A backup is already running." });
    }
    executeR2Backup(`MANUAL:${req.user?.email || req.user?.userId || "dashboard"}`).catch(() => {});
    return res.status(202).json({ status: "success", message: "Backup started. This can take a few minutes." });
  } catch (error) {
    next(error);
  }
};

// GET /settings/r2-storage/backups — database backups in R2 (newest first) with which ones the retention keeps
export const listR2Backups = async (req, res, next) => {
  try {
    const cfg = await getR2Config();
    if (!isR2Configured(cfg)) return res.json({ status: "success", data: { backups: [], configured: false } });
    const backups = await listDatabaseBackups(cfg);
    const { remove } = planRetention(backups, { keepDailyDays: cfg.keepDailyDays, keepWeeklyWeeks: cfg.keepWeeklyWeeks });
    const removeSet = new Set(remove.map((b) => b.key));
    return res.json({
      status: "success",
      data: {
        configured: true,
        timezone: cfg.backupTimezone,
        backups: backups.map((b) => ({ ...b, kind: b.ageDays < cfg.keepDailyDays ? "daily" : "weekly", willBeRemoved: removeSet.has(b.key) })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /settings/r2-storage/backups/download?key=database/... — streams one backup file
export const downloadR2Backup = async (req, res, next) => {
  try {
    const key = String(req.query.key || "");
    const cfg = await getR2Config();
    if (!isR2Configured(cfg)) return res.status(400).json({ status: "error", message: "R2 storage is not configured." });
    const obj = await getBackupObject(cfg, key);
    res.setHeader("Content-Type", "application/gzip");
    if (obj.ContentLength) res.setHeader("Content-Length", obj.ContentLength);
    res.setHeader("Content-Disposition", `attachment; filename="${key.split("/").pop()}"`);
    obj.Body.pipe(res);
  } catch (error) {
    if (error?.name === "NoSuchKey") return res.status(404).json({ status: "error", message: "Backup not found." });
    if (error?.message === "Invalid backup key") return res.status(400).json({ status: "error", message: error.message });
    next(error);
  }
};
