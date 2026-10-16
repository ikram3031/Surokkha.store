import { runDailyR2Backup } from '../../../../scripts/backup-to-r2.js';
import { LogModel } from '../models/log.model.js';
import { logger } from '../config/logger.js';
import { getR2Config, isR2Configured, recordBackupStatus } from './r2Config.service.js';
import { syncUploadsToR2 } from './r2Sync.service.js';
import { dumpDatabaseToFile } from './nodeDbDump.service.js';
import { env } from '../config/env.js';

const formatBytes = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${(Number(bytes || 0) / 1024).toFixed(1)} KB`;

let isRunning = false;

// Writes a System Logs entry for a backup run (never throws)
const writeBackupLog = async (type, description, triggeredBy) => {
  try {
    await LogModel.create({ type, typeDid: '115', description, readStatus: false, createdBy: triggeredBy });
  } catch {
    // ignore database logging errors
  }
};

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
      retentionDays: cfg.retentionDays,
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

    const size = `DB ${manifest.database.sizeFormatted}, uploads ${uploadsText}`;
    await recordBackupStatus('success', `Saved to bucket '${manifest.bucket}' (${triggeredBy})`, size);
    await writeBackupLog(
      'created',
      `Cloudflare R2 Backup: Database (${manifest.database.sizeFormatted}) saved; uploads mirror: ${uploadsText}. Bucket '${manifest.bucket}'.`,
      triggeredBy
    );
    logger.info({ manifest }, '[R2Backup] Cloudflare R2 backup finished successfully');
    return manifest;
  } catch (error) {
    await recordBackupStatus('failed', error.message).catch(() => {});
    await writeBackupLog('error', `Cloudflare R2 Backup FAILED (${triggeredBy}): ${error.message}`, triggeredBy);
    logger.error({ err: error.message }, '[R2Backup] Cloudflare R2 backup failed');
    throw error;
  } finally {
    isRunning = false;
  }
};

export const isBackupRunning = () => isRunning;
