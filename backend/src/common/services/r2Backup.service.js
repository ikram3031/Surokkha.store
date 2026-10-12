import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDailyR2Backup } from '../../../../scripts/backup-to-r2.js';
import { LogModel } from '../models/log.model.js';
import { logger } from '../config/logger.js';

// Executes full database and uploads backup to Cloudflare R2 and logs audit trail
export const executeR2Backup = async (triggeredBy = 'SCHEDULER_DAILY_3AM') => {
  logger.info({ triggeredBy }, '[R2Backup] Initiating full daily database and uploads backup to Cloudflare R2');
  try {
    const manifest = await runDailyR2Backup();
    try {
      await LogModel.create({
        type: 'created',
        typeDid: '115',
        description: `Cloudflare R2 Daily Backup: Database (${manifest.database.sizeFormatted}) and uploads (${manifest.uploads.sizeFormatted}) saved to R2 bucket '${manifest.bucket}'.`,
        readStatus: false,
        createdBy: triggeredBy,
      });
    } catch {
      // ignore database logging errors
    }
    logger.info({ manifest }, '[R2Backup] Cloudflare R2 daily backup finished successfully');
    return manifest;
  } catch (error) {
    logger.error({ err: error.message }, '[R2Backup] Cloudflare R2 daily backup failed');
    throw error;
  }
};
