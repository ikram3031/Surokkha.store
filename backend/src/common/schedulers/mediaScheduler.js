import { runOrphanMediaScan } from "../services/mediaAudit.service.js";
import { syncUploadsToR2 } from "../services/r2Sync.service.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let r2SyncTimer = null;
let orphanScanTimer = null;

// Initializes and starts media synchronization and orphan cleanup schedulers
export const initMediaSchedulers = () => {
  const syncIntervalDays = Math.max(1, env.R2_SYNC_INTERVAL_DAYS || 2);
  const syncIntervalMs = syncIntervalDays * 24 * 60 * 60 * 1000;
  const orphanScanIntervalMs = 24 * 60 * 60 * 1000; // Run orphan check daily

  logger.info(
    { r2IntervalDays: syncIntervalDays, r2Enabled: env.R2_SYNC_ENABLED },
    "[MediaScheduler] Initializing background media schedulers"
  );

  // Initial delay of 1 minute after server boot to avoid startup CPU spikes
  setTimeout(() => {
    // 1. Initial Orphan Scan
    runOrphanMediaScan("SCHEDULER_AUTO_INIT").catch((err) => {
      logger.error({ err }, "[MediaScheduler] Failed during initial orphan media scan");
    });

    // 2. Initial Cloudflare R2 Sync if enabled
    if (env.R2_SYNC_ENABLED) {
      syncUploadsToR2("SCHEDULER_AUTO_INIT").catch((err) => {
        logger.error({ err }, "[MediaScheduler] Failed during initial R2 sync");
      });
    }
  }, 60 * 1000);

  // Recurring Orphan Scan (Daily)
  orphanScanTimer = setInterval(() => {
    runOrphanMediaScan("SCHEDULER_DAILY").catch((err) => {
      logger.error({ err }, "[MediaScheduler] Failed during daily orphan media scan");
    });
  }, orphanScanIntervalMs);

  // Recurring R2 Sync (Every N Days)
  if (env.R2_SYNC_ENABLED) {
    r2SyncTimer = setInterval(() => {
      syncUploadsToR2("SCHEDULER_CRON").catch((err) => {
        logger.error({ err }, "[MediaScheduler] Failed during periodic R2 sync");
      });
    }, syncIntervalMs);
  }
};

// Stops all running background media scheduler timers
export const stopMediaSchedulers = () => {
  if (orphanScanTimer) {
    clearInterval(orphanScanTimer);
    orphanScanTimer = null;
  }
  if (r2SyncTimer) {
    clearInterval(r2SyncTimer);
    r2SyncTimer = null;
  }
  logger.info("[MediaScheduler] Background media schedulers stopped");
};
