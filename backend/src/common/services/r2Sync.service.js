import fs from "fs";
import path from "path";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2Client } from "../config/r2.config.js";
import { env } from "../config/env.js";
import { R2SyncLogModel } from "../models/r2SyncLog.model.js";
import { LogModel } from "../models/log.model.js";
import { logger } from "../config/logger.js";

// Returns MIME content-type based on file extension
const getMimeType = (ext) => {
  const map = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
    ".pdf": "application/pdf",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
};

// Recursively walks the uploads directory and collects all local files
const getAllLocalUploadFiles = async (dirPath, baseDir) => {
  let fileList = [];
  if (!fs.existsSync(dirPath)) return fileList;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const sub = await getAllLocalUploadFiles(fullPath, baseDir);
      fileList = fileList.concat(sub);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const validExtensions = [".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif", ".pdf"];
      if (validExtensions.includes(ext)) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const relativeKey = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          fileList.push({
            key: relativeKey, // e.g. "uploads/2608/260813/product.webp"
            fullPath,
            size: stats.size,
            mtime: stats.mtime,
            ext,
          });
        } catch {
          // ignore stat errors
        }
      }
    }
  }
  return fileList;
};

// Fetches all object keys currently residing inside the Cloudflare R2 bucket
export const listAllR2ObjectKeys = async (r2Client, bucketName, prefix = "uploads/") => {
  const r2KeyMap = new Map();
  let continuationToken = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await r2Client.send(command);
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          r2KeyMap.set(obj.Key, {
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
          });
        }
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return r2KeyMap;
};

// Performs synchronization between local uploads directory and Cloudflare R2 bucket
export const syncUploadsToR2 = async (triggeredBy = "SCHEDULER") => {
  const startTime = Date.now();
  const r2Client = getR2Client();

  if (!r2Client || !env.R2_BUCKET_NAME) {
    logger.warn("[R2Sync] Cloudflare R2 is not fully configured in environment (.env)");
    return {
      status: "SKIPPED",
      message: "Cloudflare R2 credentials or bucket name missing.",
    };
  }

  logger.info({ triggeredBy }, "[R2Sync] Initiating Cloudflare R2 differential synchronization");

  const syncLog = await R2SyncLogModel.create({
    triggeredBy,
    status: "RUNNING",
  });

  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const localFiles = await getAllLocalUploadFiles(uploadsDir, process.cwd());

    // Get remote R2 object map
    const r2KeyMap = await listAllR2ObjectKeys(r2Client, env.R2_BUCKET_NAME, "uploads/");

    // Calculate files missing on R2
    const missingOnR2 = [];
    for (const local of localFiles) {
      const remoteObj = r2KeyMap.get(local.key);
      if (!remoteObj || remoteObj.size !== local.size) {
        missingOnR2.push(local);
      }
    }

    const syncedFiles = [];
    let syncedCount = 0;

    // Upload missing files with controlled concurrency
    const CONCURRENCY = 5;
    for (let i = 0; i < missingOnR2.length; i += CONCURRENCY) {
      const batch = missingOnR2.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (file) => {
          const fileBuffer = await fs.promises.readFile(file.fullPath);
          const putCommand = new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: file.key,
            Body: fileBuffer,
            ContentType: getMimeType(file.ext),
          });
          await r2Client.send(putCommand);
          syncedFiles.push({ key: file.key, size: file.size });
          syncedCount++;
        })
      );
    }

    const durationMs = Date.now() - startTime;

    syncLog.status = "SUCCESS";
    syncLog.totalLocalFiles = localFiles.length;
    syncLog.totalR2Files = r2KeyMap.size + syncedCount;
    syncLog.syncedFilesCount = syncedCount;
    syncLog.syncedFiles = syncedFiles.slice(0, 100); // store top 100 entries for history
    syncLog.durationMs = durationMs;
    syncLog.completedAt = new Date();
    await syncLog.save();

    if (syncedCount > 0) {
      await LogModel.create({
        type: "created",
        typeDid: "110",
        description: `Cloudflare R2 Sync: Successfully uploaded ${syncedCount} missing media file(s) to R2 storage.`,
        readStatus: false,
        createdBy: triggeredBy,
      });
    }

    logger.info(
      { syncedCount, totalLocal: localFiles.length, durationMs },
      "[R2Sync] Cloudflare R2 synchronization completed successfully"
    );

    return {
      status: "SUCCESS",
      totalLocalFiles: localFiles.length,
      syncedCount,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    syncLog.status = "FAILED";
    syncLog.errorMessage = error.message;
    syncLog.durationMs = durationMs;
    syncLog.completedAt = new Date();
    await syncLog.save();

    logger.error({ err: error }, "[R2Sync] Cloudflare R2 synchronization failed");
    throw error;
  }
};
