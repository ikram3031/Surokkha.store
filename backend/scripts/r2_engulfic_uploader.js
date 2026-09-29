#!/usr/bin/env node

/**
 * ☁️ Engulfic Cloudflare R2 Backup & Upload Engine (ESM)
 * 
 * Uploads full database dumps, product catalogs, categories, seeder scripts,
 * and media assets into the 'client-hub' bucket under the 'engulfic/' prefix.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      flags[key] = val;
    }
  }
  return flags;
};

const getMimeType = (ext) => {
  const map = {
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.js': 'application/javascript',
    '.md': 'text/markdown',
    '.txt': 'text/plain'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
};

const getFilesRecursive = (dir, rootDir) => {
  let fileList = [];
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileList = fileList.concat(getFilesRecursive(full, rootDir));
    } else {
      const rel = path.relative(rootDir, full).replace(/\\/g, '/');
      const ext = path.extname(entry.name);
      fileList.push({
        fullPath: full,
        r2Key: 'engulfic/' + rel,
        ext,
        size: fs.statSync(full).size
      });
    }
  }
  return fileList;
};

const run = async () => {
  const flags = parseArgs();
  
  const accountId = flags['account-id'] || process.env.R2_ACCOUNT_ID;
  const accessKeyId = flags['access-key-id'] || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = flags['secret-access-key'] || process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = flags['bucket'] || process.env.R2_BUCKET_NAME || 'client-hub';

  console.log('=====================================================');
  console.log('☁️ Engulfic -> Cloudflare R2 Backup Synchronizer');
  console.log('=====================================================');
  console.log(`Target Bucket: ${bucketName}`);
  console.log(`Target Prefix: engulfic/`);

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('\n⚠️ Missing Cloudflare R2 Credentials!');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  // Verify / Ensure Bucket Exists
  try {
    console.log(`\nVerifying bucket '${bucketName}'...`);
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket '${bucketName}' exists and is accessible.`);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`Creating bucket '${bucketName}'...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Bucket '${bucketName}' created successfully.`);
    } else {
      console.warn(`Bucket check note: ${err.message}`);
    }
  }

  const backupDir = path.resolve(__dirname, '../../backups/engulfic');
  const filesToUpload = getFilesRecursive(backupDir, backupDir);
  console.log(`\nFound ${filesToUpload.length} files to upload from local backup bundle.\n`);

  let successCount = 0;
  let failCount = 0;
  let totalBytes = 0;

  const CONCURRENCY = 6;
  for (let i = 0; i < filesToUpload.length; i += CONCURRENCY) {
    const batch = filesToUpload.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (file) => {
      try {
        const body = fs.readFileSync(file.fullPath);
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: file.r2Key,
          Body: body,
          ContentType: getMimeType(file.ext)
        });
        await s3Client.send(command);
        successCount++;
        totalBytes += file.size;
        console.log(`[UPLOADED] ${file.r2Key} (${(file.size / 1024).toFixed(1)} KB)`);
      } catch (uploadErr) {
        failCount++;
        console.error(`[FAILED] ${file.r2Key}: ${uploadErr.message}`);
      }
    }));
  }

  console.log('\n=====================================================');
  console.log('🎉 Engulfic R2 Backup Complete!');
  console.log(`Total Uploaded: ${successCount} / ${filesToUpload.length} files`);
  console.log(`Total Size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`R2 Destination: ${bucketName}/engulfic/`);
  console.log('=====================================================');
};

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
