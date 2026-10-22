import { Cron } from 'croner';
import { executeR2Backup } from '../services/r2Backup.service.js';
import { getR2Config, isR2Configured, recordBackupStatus, DEFAULT_BACKUP_CRON, DEFAULT_BACKUP_TIMEZONE } from '../services/r2Config.service.js';
import { StoreSettingsModel } from '../models/storeSettings.model.js';
import { logger } from '../config/logger.js';

const CATCH_UP_AFTER_MS = 26 * 60 * 60 * 1000; // a daily backup older than this counts as missed
let backupJob = null;
let catchUpTimer = null;

const runScheduled = (trigger) =>
  executeR2Backup(trigger).catch((err) => {
    logger.error({ err: err.message }, `[BackupScheduler] ${trigger} backup failed`);
  });

// (Re)creates the cron job from the R2 Storage settings; call again after settings change
export const scheduleBackupJob = async () => {
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
  }

  let cfgError = null;
  const cfg = await getR2Config().catch((err) => {
    cfgError = err.message;
    return null;
  });
  if (!cfg || !cfg.backupEnabled || !isR2Configured(cfg)) {
    // Say exactly why nothing is scheduled, and surface it on the R2 Storage page
    const reason = cfgError
      ? `Could not read R2 settings: ${cfgError}`
      : !cfg?.backupEnabled
        ? 'Automatic backup is turned off in R2 Storage settings'
        : `R2 is not configured (source: ${cfg.source}); enable R2 and save Account ID, keys and bucket in R2 Storage settings`;
    logger.warn({ source: cfg?.source, reason }, `[BackupScheduler] No backup job scheduled: ${reason}`);
    await recordBackupStatus('failed', `Auto backup not scheduled: ${reason}`).catch(() => {});
    return null;
  }

  const pattern = cfg.backupCron || DEFAULT_BACKUP_CRON;
  const timezone = cfg.backupTimezone || DEFAULT_BACKUP_TIMEZONE;
  try {
    backupJob = new Cron(pattern, { timezone, protect: true, name: 'r2-backup' }, () => runScheduled('SCHEDULER_CRON'));
  } catch (err) {
    logger.error({ pattern, err: err.message }, '[BackupScheduler] Invalid backup cron expression; falling back to default');
    backupJob = new Cron(DEFAULT_BACKUP_CRON, { timezone, protect: true, name: 'r2-backup' }, () => runScheduled('SCHEDULER_CRON'));
  }

  logger.info({ pattern, timezone, nextRun: backupJob.nextRun()?.toISOString() }, '[BackupScheduler] R2 backup scheduled');
  return backupJob.nextRun();
};

// Next scheduled run time (null when no job is active)
export const getNextBackupRun = () => backupJob?.nextRun() || null;

// Starts the cron job and, if the last successful backup is too old (e.g. server was down at run time), catches up once
export const initBackupScheduler = () => {
  scheduleBackupJob()
    .then(async (nextRun) => {
      if (!nextRun) return;
      const doc = await StoreSettingsModel.findOne({ key: 'default' }, { r2Storage: 1 }).lean();
      const r2 = doc?.r2Storage || {};
      const lastOk = r2.lastBackupStatus === 'success' && r2.lastBackupAt ? new Date(r2.lastBackupAt).getTime() : 0;
      if (Date.now() - lastOk > CATCH_UP_AFTER_MS) {
        logger.info('[BackupScheduler] Last successful backup is older than 26h; running a catch-up backup in 2 minutes');
        catchUpTimer = setTimeout(() => runScheduled('SCHEDULER_CATCH_UP'), 2 * 60 * 1000);
      }
    })
    .catch((err) => logger.error({ err: err.message }, '[BackupScheduler] Failed to start backup scheduler'));
};

// Stops the cron job and any pending catch-up run
export const stopBackupScheduler = () => {
  if (backupJob) backupJob.stop();
  if (catchUpTimer) clearTimeout(catchUpTimer);
  backupJob = null;
  catchUpTimer = null;
  logger.info('[BackupScheduler] Background backup scheduler stopped');
};

// Allows immediate manual triggering of the full R2 backup workflow
export const triggerManualBackup = async (triggeredBy = 'MANUAL_TRIGGER') => executeR2Backup(triggeredBy);
