import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Resolves AWS S3 client package from standard or backend node_modules
const loadS3Package = () => {
  try {
    return require('@aws-sdk/client-s3');
  } catch {}
  try {
    const localBackend = path.resolve(process.cwd(), 'backend/node_modules/@aws-sdk/client-s3');
    return require(localBackend);
  } catch {}
  try {
    const vpsBackend = path.resolve('/opt/clients/surokkha/backend/node_modules/@aws-sdk/client-s3');
    return require(vpsBackend);
  } catch (err) {
    throw new Error(`Unable to resolve @aws-sdk/client-s3 package: ${err.message}`);
  }
};

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = loadS3Package();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'fa0942a4bd8e442e22f78fdb6a2a605a';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '0fbd22ecac4786634ff398fbe388991d';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'e71e7f8fbf0aa122dc6ed476eb67d74eec2eeaebb44274417a50daa20ca489d4';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'surokkha';
const DB_NAME = process.env.MONGODB_DB_NAME || 'surokkha-db';
const DB_CONTAINER = process.env.MONGODB_CONTAINER_NAME || 'surokkha-mongodb-live';
const RETENTION_DAYS = parseInt(process.env.R2_BACKUP_RETENTION_DAYS || '30', 10);

// Formats a date object into a clean timestamp string
const formatTimestamp = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}${m}${d}_${h}${min}${s}`;
};

// Initializes the AWS S3 client targeting Cloudflare R2
const getR2Client = () => {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
};

// Uploads a local file buffer or stream to Cloudflare R2
const uploadFileToR2 = async (client, bucket, key, filePath, contentType) => {
  const fileStream = fs.createReadStream(filePath);
  const stats = fs.statSync(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentLength: stats.size,
    ContentType: contentType,
  });
  await client.send(command);
  return stats.size;
};

// Uploads raw text or JSON string to Cloudflare R2
const uploadContentToR2 = async (client, bucket, key, content, contentType) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(content, 'utf8'),
    ContentType: contentType,
  });
  await client.send(command);
  return Buffer.byteLength(content, 'utf8');
};

// Prunes backup objects in R2 that exceed the retention period
const pruneOldR2Backups = async (client, bucket, prefix, retentionDays) => {
  const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const listCmd = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });
  const listRes = await client.send(listCmd);
  if (!listRes.Contents || listRes.Contents.length === 0) return 0;

  const toDelete = listRes.Contents
    .filter((obj) => {
      if (obj.Key.includes('latest')) return false;
      return obj.LastModified && obj.LastModified.getTime() < cutoffTime;
    })
    .map((obj) => ({ Key: obj.Key }));

  if (toDelete.length > 0) {
    const deleteCmd = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: toDelete },
    });
    await client.send(deleteCmd);
  }
  return toDelete.length;
};

// Finds all valid unique local upload directories on host system
const detectUploadDirs = () => {
  const candidates = [
    '/opt/clients/surokkha/backend/uploads',
    '/var/uploads/surokkha',
    path.resolve(process.cwd(), 'backend/uploads'),
    path.resolve(process.cwd(), 'uploads'),
  ];
  const uniquePaths = [...new Set(candidates.map((dir) => path.resolve(dir)))];
  return uniquePaths.filter((dir) => fs.existsSync(dir));
};

// Executes the complete database and uploads backup to Cloudflare R2
export const runDailyR2Backup = async () => {
  const startTime = Date.now();
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const tempDir = path.join(os.tmpdir(), `surokkha-backup-${timestamp}`);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const s3Client = getR2Client();
  console.log(`[Backup] Starting Surokkha daily backup [ID: ${timestamp}]`);

  let dbSizeBytes = 0;
  const dbArchiveFile = path.join(tempDir, `surokkha_db_${timestamp}.archive.gz`);

  try {
    const isDocker = (() => {
      try {
        const out = execSync(`docker ps --filter "name=${DB_CONTAINER}" --format "{{.Names}}"`, { encoding: 'utf8' });
        return out.trim().includes(DB_CONTAINER);
      } catch {
        return false;
      }
    })();

    if (isDocker) {
      console.log(`[Backup] Executing MongoDB dump via Docker container: ${DB_CONTAINER}`);
      execSync(`docker exec ${DB_CONTAINER} mongodump --db=${DB_NAME} --archive --gzip > "${dbArchiveFile}"`, { stdio: ['ignore', 'pipe', 'inherit'] });
    } else {
      console.log('[Backup] Executing MongoDB dump via host mongodump tool');
      const uri = process.env.MONGODB_URI || `mongodb://127.0.0.1:27019/${DB_NAME}`;
      execSync(`mongodump --uri="${uri}" --archive="${dbArchiveFile}" --gzip`, { stdio: 'inherit' });
    }

    if (!fs.existsSync(dbArchiveFile) || fs.statSync(dbArchiveFile).size < 100) {
      throw new Error('Database dump output file is missing or empty');
    }

    dbSizeBytes = fs.statSync(dbArchiveFile).size;
    console.log(`[Backup] Database archive generated successfully (${(dbSizeBytes / 1024).toFixed(2)} KB)`);

    console.log('[Backup] Uploading database archive to Cloudflare R2...');
    await uploadFileToR2(s3Client, BUCKET_NAME, `database/surokkha_db_${timestamp}.archive.gz`, dbArchiveFile, 'application/gzip');
    await uploadFileToR2(s3Client, BUCKET_NAME, 'database/latest.archive.gz', dbArchiveFile, 'application/gzip');
    console.log('[Backup] Database archive uploaded to R2 (database/surokkha_db_' + timestamp + '.archive.gz and database/latest.archive.gz)');
  } catch (err) {
    console.error('[Backup] Database backup failed:', err.message);
    throw err;
  }

  let uploadsSizeBytes = 0;
  const uploadDirs = detectUploadDirs();
  const uploadsArchiveFile = path.join(tempDir, `surokkha_uploads_${timestamp}.tar.gz`);

  if (uploadDirs.length > 0) {
    try {
      console.log(`[Backup] Archiving upload directories: ${uploadDirs.join(', ')}`);
      const dirsList = uploadDirs.map((d) => `"${d}"`).join(' ');
      execSync(`tar -czf "${uploadsArchiveFile}" ${dirsList}`, { stdio: 'inherit' });

      if (fs.existsSync(uploadsArchiveFile)) {
        uploadsSizeBytes = fs.statSync(uploadsArchiveFile).size;
        console.log(`[Backup] Uploads archive generated successfully (${(uploadsSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);

        console.log('[Backup] Uploading uploads archive to Cloudflare R2...');
        await uploadFileToR2(s3Client, BUCKET_NAME, `uploads/surokkha_uploads_${timestamp}.tar.gz`, uploadsArchiveFile, 'application/gzip');
        await uploadFileToR2(s3Client, BUCKET_NAME, 'uploads/latest.tar.gz', uploadsArchiveFile, 'application/gzip');
        console.log('[Backup] Uploads archive uploaded to R2 (uploads/surokkha_uploads_' + timestamp + '.tar.gz and uploads/latest.tar.gz)');
      }
    } catch (err) {
      console.error('[Backup] Uploads archive failed:', err.message);
      throw err;
    }
  } else {
    console.warn('[Backup] No upload directories detected on system. Skipping uploads archive.');
  }

  const manifest = {
    backupId: `surokkha_backup_${timestamp}`,
    client: 'surokkha',
    bucket: BUCKET_NAME,
    timestamp: now.toISOString(),
    timezone: 'Asia/Dhaka',
    database: {
      dbName: DB_NAME,
      archiveKey: `database/surokkha_db_${timestamp}.archive.gz`,
      sizeBytes: dbSizeBytes,
      sizeFormatted: `${(dbSizeBytes / 1024).toFixed(2)} KB`,
    },
    uploads: {
      archiveKey: uploadsSizeBytes > 0 ? `uploads/surokkha_uploads_${timestamp}.tar.gz` : null,
      sizeBytes: uploadsSizeBytes,
      sizeFormatted: `${(uploadsSizeBytes / (1024 * 1024)).toFixed(2)} MB`,
      directoriesIncluded: uploadDirs,
    },
    durationMs: Date.now() - startTime,
    status: 'SUCCESS',
  };

  const manifestContent = JSON.stringify(manifest, null, 2);
  await uploadContentToR2(s3Client, BUCKET_NAME, `metadata/manifest_${timestamp}.json`, manifestContent, 'application/json');
  await uploadContentToR2(s3Client, BUCKET_NAME, 'metadata/latest_manifest.json', manifestContent, 'application/json');
  console.log('[Backup] Metadata manifest uploaded to R2');

  try {
    const prunedDb = await pruneOldR2Backups(s3Client, BUCKET_NAME, 'database/', RETENTION_DAYS);
    const prunedUploads = await pruneOldR2Backups(s3Client, BUCKET_NAME, 'uploads/', RETENTION_DAYS);
    if (prunedDb > 0 || prunedUploads > 0) {
      console.log(`[Backup] Retention cleanup: Pruned ${prunedDb} old DB backup(s) and ${prunedUploads} old upload(s) older than ${RETENTION_DAYS} days.`);
    }
  } catch (pruneErr) {
    console.warn('[Backup] Retention cleanup warning:', pruneErr.message);
  }

  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (cleanErr) {
    console.warn('[Backup] Local temp cleanup warning:', cleanErr.message);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Backup] All tasks completed successfully in ${totalTime}s! Saved to R2 bucket: ${BUCKET_NAME}`);
  return manifest;
};

if (process.argv[1] && process.argv[1].endsWith('backup-to-r2.js')) {
  runDailyR2Backup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Backup] Critical error executing backup:', err);
      process.exit(1);
    });
}
