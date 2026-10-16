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
    // backend/node_modules next to this scripts/ folder, regardless of the working directory
    const besideScript = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../backend/node_modules/@aws-sdk/client-s3');
    return require(besideScript);
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

// R2 credentials come from the dashboard R2 Storage settings (passed in) or the environment; never hard-coded
const ENV_R2 = {
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  retentionDays: parseInt(process.env.R2_BACKUP_RETENTION_DAYS || '30', 10),
};
const DB_NAME = process.env.MONGODB_DB_NAME || 'surokkha-db';
const DB_CONTAINER = process.env.MONGODB_CONTAINER_NAME || 'surokkha-mongodb-live';

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
export const getR2Client = (cfg) => {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
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
export const runDailyR2Backup = async (overrides = {}) => {
  const cfg = { ...ENV_R2 };
  for (const [k, v] of Object.entries(overrides)) if (v !== undefined && v !== null && v !== '') cfg[k] = v;
  const missing = ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName'].filter((k) => !cfg[k]);
  if (missing.length) throw new Error(`R2 storage is not configured (missing: ${missing.join(', ')})`);
  const BUCKET_NAME = cfg.bucketName;
  const RETENTION_DAYS = Number(cfg.retentionDays) || 30;
  const startTime = Date.now();
  const now = new Date();
  const timestamp = formatTimestamp(now);
  const tempDir = path.join(os.tmpdir(), `surokkha-backup-${timestamp}`);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const s3Client = getR2Client(cfg);
  console.log(`[Backup] Starting Surokkha daily backup [ID: ${timestamp}]`);

  let dbSizeBytes = 0;
  let dbArchiveFile = path.join(tempDir, `surokkha_db_${timestamp}.archive.gz`);
  let dbExt = 'archive.gz';
  let dbMethod = '';

  try {
    const hasCommand = (cmd) => {
      try {
        execSync(cmd, { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    };
    const uri = cfg.mongoUri || process.env.MONGODB_URI || '';

    // 1) mongodump straight over the database connection (installed in the backend image) — no docker needed
    if (uri && hasCommand('mongodump --version')) {
      try {
        console.log('[Backup] Dumping MongoDB with mongodump over MONGODB_URI');
        execSync(`mongodump --uri="${uri}" --archive="${dbArchiveFile}" --gzip`, { stdio: ['ignore', 'ignore', 'pipe'] });
        dbMethod = 'mongodump';
      } catch (err) {
        console.warn('[Backup] mongodump over URI failed:', err.message);
      }
    }

    // 2) mongodump inside the MongoDB container (only when this process can run docker)
    if (!dbMethod && hasCommand(`docker ps --filter "name=${DB_CONTAINER}" --format "{{.Names}}"`)) {
      try {
        console.log(`[Backup] Dumping MongoDB via Docker container: ${DB_CONTAINER}`);
        execSync(`docker exec ${DB_CONTAINER} mongodump --db=${DB_NAME} --archive --gzip > "${dbArchiveFile}"`, { stdio: ['ignore', 'pipe', 'pipe'] });
        dbMethod = 'docker-mongodump';
      } catch (err) {
        console.warn('[Backup] docker mongodump failed:', err.message);
      }
    }

    // 3) Fallback: the backend reads every collection itself (restore with scripts/restore-node-dump.js)
    if (!dbMethod && typeof cfg.nodeDump === 'function') {
      console.log('[Backup] Dumping MongoDB from inside Node (EJSON fallback)');
      dbExt = 'ejson.gz';
      dbArchiveFile = path.join(tempDir, `surokkha_db_${timestamp}.${dbExt}`);
      await cfg.nodeDump(dbArchiveFile);
      dbMethod = 'node-ejson';
    }

    if (!dbMethod) {
      throw new Error('No way to dump the database: mongodump is not installed and docker is not available');
    }

    if (!fs.existsSync(dbArchiveFile) || fs.statSync(dbArchiveFile).size < 100) {
      throw new Error('Database dump output file is missing or empty');
    }

    dbSizeBytes = fs.statSync(dbArchiveFile).size;
    console.log(`[Backup] Database archive generated successfully (${(dbSizeBytes / 1024).toFixed(2)} KB)`);

    console.log('[Backup] Uploading database archive to Cloudflare R2...');
    await uploadFileToR2(s3Client, BUCKET_NAME, `database/surokkha_db_${timestamp}.${dbExt}`, dbArchiveFile, 'application/gzip');
    await uploadFileToR2(s3Client, BUCKET_NAME, `database/latest.${dbExt}`, dbArchiveFile, 'application/gzip');
    console.log(`[Backup] Database dump (${dbMethod}) uploaded to R2 as database/surokkha_db_${timestamp}.${dbExt}`);
  } catch (err) {
    console.error('[Backup] Database backup failed:', err.message);
    throw err;
  }

  let uploadsSizeBytes = 0;
  const uploadDirs = detectUploadDirs();
  const uploadsArchiveFile = path.join(tempDir, `surokkha_uploads_${timestamp}.tar.gz`);

  // Uploads are mirrored file-by-file by r2Sync.service (only new/changed files); the full tar archive is opt-in
  if (cfg.includeUploadsArchive && uploadDirs.length > 0) {
    try {
      console.log(`[Backup] Archiving upload directories: ${uploadDirs.join(', ')}`);
      const dirsList = uploadDirs.map((d) => `"${d}"`).join(' ');
      execSync(`tar -czf "${uploadsArchiveFile}" ${dirsList}`, { stdio: 'inherit' });

      if (fs.existsSync(uploadsArchiveFile)) {
        uploadsSizeBytes = fs.statSync(uploadsArchiveFile).size;
        console.log(`[Backup] Uploads archive generated successfully (${(uploadsSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);

        console.log('[Backup] Uploading uploads archive to Cloudflare R2...');
        await uploadFileToR2(s3Client, BUCKET_NAME, `archives/uploads/surokkha_uploads_${timestamp}.tar.gz`, uploadsArchiveFile, 'application/gzip');
        await uploadFileToR2(s3Client, BUCKET_NAME, 'archives/uploads/latest.tar.gz', uploadsArchiveFile, 'application/gzip');
        console.log('[Backup] Uploads archive uploaded to R2 (archives/uploads/)');
      }
    } catch (err) {
      console.error('[Backup] Uploads archive failed:', err.message);
      throw err;
    }
  } else {
    console.log('[Backup] Uploads tar archive skipped (uploads are mirrored incrementally).');
  }

  const manifest = {
    backupId: `surokkha_backup_${timestamp}`,
    client: 'surokkha',
    bucket: BUCKET_NAME,
    timestamp: now.toISOString(),
    timezone: 'Asia/Dhaka',
    database: {
      dbName: DB_NAME,
      archiveKey: `database/surokkha_db_${timestamp}.${dbExt}`,
      method: dbMethod,
      sizeBytes: dbSizeBytes,
      sizeFormatted: `${(dbSizeBytes / 1024).toFixed(2)} KB`,
    },
    uploads: {
      archiveKey: uploadsSizeBytes > 0 ? `archives/uploads/surokkha_uploads_${timestamp}.tar.gz` : null,
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
    // Never prune uploads/: that prefix is the live mirror of the uploads folder
    const prunedUploads = await pruneOldR2Backups(s3Client, BUCKET_NAME, 'archives/uploads/', RETENTION_DAYS);
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
