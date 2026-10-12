import { syncPathaoOrders } from "../services/pathaoOrderSync.service.js";
import { logger } from "../config/logger.js";

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes
let startTimeout = null;
let syncTimer = null;

const runSync = () =>
  syncPathaoOrders("SCHEDULER").catch((err) => {
    logger.error({ err: err.message }, "[PathaoSync] Scheduled order sync failed");
  });

// Starts the recurring Pathao order status/payment sync (first run 1 minute after boot)
export const initPathaoSyncScheduler = () => {
  logger.info("[PathaoSync] Scheduler started (every 30 minutes)");
  startTimeout = setTimeout(runSync, 60 * 1000);
  syncTimer = setInterval(runSync, SYNC_INTERVAL_MS);
};

export const stopPathaoSyncScheduler = () => {
  if (startTimeout) clearTimeout(startTimeout);
  if (syncTimer) clearInterval(syncTimer);
  startTimeout = null;
  syncTimer = null;
};
