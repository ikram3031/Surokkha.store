import { runDailyR2Backup } from '../../../../scripts/backup-to-r2.js';
import { notifyBackupResult } from '../utils/backupNotification.js';
import { logger } from '../config/logger.js';
import { getR2Config, isR2Configured, recordBackupStatus } from './r2Config.service.js';
import { syncUploadsToR2 } from './r2Sync.service.js';
import { dumpDatabaseToFile } from './nodeDbDump.service.js';
import { env } from '../config/env.js';
import { pruneDatabaseBackups } from './r2BackupHistory.service.js';

const formatBytes = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${(Number(bytes || 0) / 1024).toFixed(1)} KB`;

let isRunning = false;

// Executes full database and uploads backup to Cloudflare R2, recording the result in settings and System Logs
export const executeR2Backup = async (triggeredBy = 'SCHEDULER_DAILY_3AM') => {
  if (isRunning) throw new Error('A backup is already running');
  isRunning = true;
  logger.info({ triggeredBy }, '[R2Backup] Initiating full database and uploads backup to Cloudflare R2');

  try {
    const cfg = await getR2Config();
    if (!isR2Configured(cfg)) {
      throw new Error('R2 storage is not configured. Add credentials in Settings → Integrations → R2 Storage.');
    }

    await recordBackupStatus('running', `Started by ${triggeredBy}`);
    const manifest = await runDailyR2Backup({
      accountId: cfg.accountId,
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      bucketName: cfg.bucketName,
      retentionDays: (Number(cfg.keepWeeklyWeeks) || 5) * 7,
      skipDatabasePrune: true,
      mongoUri: env.MONGODB_URI,
      nodeDump: dumpDatabaseToFile,
    });

    // Uploads: incremental mirror (only files that are new or changed since the last run)
    const sync = await syncUploadsToR2(`BACKUP:${triggeredBy}`, cfg);
    const uploadsText =
      sync?.status === 'SUCCESS'
        ? `${sync.syncedCount} new/changed file(s) (${formatBytes(sync.syncedBytes)}) of ${sync.totalLocalFiles}`
        : 'uploads mirror skipped';
    manifest.uploadsMirror = sync;

    // Retention: keep every backup from the last N days, then one per week (Sunday) for M weeks
    const pruned = await pruneDatabaseBackups(cfg, { keepDailyDays: cfg.keepDailyDays, keepWeeklyWeeks: cfg.keepWeeklyWeeks }).catch((err) => {
      logger.warn({ err: err.message }, '[R2Backup] Retention prune failed');
      return 0;
    });

    const size = `DB ${manifest.database.sizeFormatted}, uploads ${uploadsText}`;
    await recordBackupStatus('success', `Saved to bucket '${manifest.bucket}' (${triggeredBy})`, size);
    await notifyBackupResult({
      ok: true,
      triggeredBy,
      bucket: manifest.bucket,
      database: manifest.database.sizeFormatted,
      uploads: uploadsText,
      pruned,
    });
    logger.info({ manifest }, '[R2Backup] Cloudflare R2 backup finished successfully');
    return manifest;
  } catch (error) {
    await recordBackupStatus('failed', error.message).catch(() => {});
    await notifyBackupResult({ ok: false, triggeredBy, error: error.message });
    logger.error({ err: error.message }, '[R2Backup] Cloudflare R2 backup failed');
    throw error;
  } finally {
    isRunning = false;
  }
};

export const isBackupRunning = () => isRunning;
