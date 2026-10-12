import { executeR2Backup } from '../services/r2Backup.service.js';
import { logger } from '../config/logger.js';

let backupTimeoutTimer = null;
let backupIntervalTimer = null;

// Calculates remaining milliseconds until the next 03:00 AM in Asia/Dhaka timezone
const getMsUntilNext3AmDhaka = () => {
  const timeZone = 'Asia/Dhaka';
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, parseInt(p.value, 10)]));
  const targetHour = 3;
  let targetDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, targetHour - 6, 0, 0));
  if (targetDate.getTime() <= now.getTime()) {
    targetDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1, targetHour - 6, 0, 0));
  }
  return targetDate.getTime() - now.getTime();
};

// Schedules the recurring daily 3:00 AM Cloudflare R2 backup task
export const initBackupScheduler = () => {
  const msUntilNext3Am = getMsUntilNext3AmDhaka();
  const hoursRemaining = (msUntilNext3Am / (1000 * 60 * 60)).toFixed(2);

  logger.info(
    { nextRunInHours: hoursRemaining, timezone: 'Asia/Dhaka', targetHour: '03:00' },
    `[BackupScheduler] Scheduled daily R2 backup to Cloudflare (next run in ${hoursRemaining} hours at 03:00 AM Asia/Dhaka)`
  );

  backupTimeoutTimer = setTimeout(() => {
    executeR2Backup('SCHEDULER_DAILY_3AM').catch((err) => {
      logger.error({ err: err.message }, '[BackupScheduler] Daily 3:00 AM R2 backup execution encountered an error');
    });

    backupIntervalTimer = setInterval(() => {
      executeR2Backup('SCHEDULER_DAILY_3AM').catch((err) => {
        logger.error({ err: err.message }, '[BackupScheduler] Daily 3:00 AM R2 backup execution encountered an error');
      });
    }, 24 * 60 * 60 * 1000);
  }, msUntilNext3Am);
};

// Stops and clears all running background backup scheduler timers
export const stopBackupScheduler = () => {
  if (backupTimeoutTimer) {
    clearTimeout(backupTimeoutTimer);
    backupTimeoutTimer = null;
  }
  if (backupIntervalTimer) {
    clearInterval(backupIntervalTimer);
    backupIntervalTimer = null;
  }
  logger.info('[BackupScheduler] Background daily backup scheduler stopped');
};

// Allows immediate manual triggering of the full R2 backup workflow
export const triggerManualBackup = async (triggeredBy = 'MANUAL_TRIGGER') => {
  return executeR2Backup(triggeredBy);
};
