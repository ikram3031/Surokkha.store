import { findDueCapiRetries, attemptCapiSend } from "../../common/services/metaCapiLog.service.js";
import { getMetaPixelConfig } from "../../common/services/facebookCapi.service.js";
import { logger } from "../../common/config/logger.js";

const RETRY_INTERVAL_MS = 60 * 1000;
let retryTimer = null;
let running = false;

// Resends failed Meta CAPI events whose retry time has come, using the pixel's current token
const runRetries = async () => {
  if (running) return;
  running = true;
  try {
    const due = await findDueCapiRetries();
    const configs = {};
    for (const record of due) {
      configs[record.site] ||= await getMetaPixelConfig(record.site);
      const { pixelId, accessToken } = configs[record.site];
      await attemptCapiSend(record, { pixelId: pixelId || record.pixelId, accessToken: accessToken || "" });
    }
  } catch (err) {
    logger.error({ err: err.message }, "[Meta CAPI] Retry run failed");
  } finally {
    running = false;
  }
};

// Starts the once-a-minute retry loop for failed Meta CAPI events
export const initMetaCapiRetryScheduler = () => {
  logger.info("[Meta CAPI] Retry scheduler started (every minute)");
  retryTimer = setInterval(runRetries, RETRY_INTERVAL_MS);
};

export const stopMetaCapiRetryScheduler = () => {
  if (retryTimer) clearInterval(retryTimer);
  retryTimer = null;
};
