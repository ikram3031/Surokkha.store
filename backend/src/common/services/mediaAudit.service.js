import fs from "fs";
import path from "path";
import { ProductModel } from "../models/product.model.js";
import { CategoryModel } from "../models/category.model.js";
import { BrandModel } from "../models/brand.model.js";
import { MediaCleanupAuditModel } from "../models/mediaCleanupAudit.model.js";
import { LogModel } from "../models/log.model.js";
import { logger } from "../config/logger.js";

// Whitelist of protected assets that must never be considered orphans
const PROTECTED_SYSTEM_PATHS = new Set([
  "/uploads/product_placeholder.webp",
  "/uploads/placeholder.webp",
  "/uploads/logo.png",
  "/uploads/favicon.ico",
]);

// Helper to normalize and add image path to the referenced URLs set
const collectUrl = (rawUrl, targetSet) => {
  if (!rawUrl || typeof rawUrl !== "string") return;
  const clean = rawUrl.trim();
  if (!clean) return;

  // If path starts with /uploads or uploads/, normalize to standard /uploads format
  let normalized = clean;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const parsed = new URL(normalized);
      normalized = parsed.pathname;
    } catch {
      // Fallback
    }
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.startsWith("/uploads/")) {
    targetSet.add(normalized);
  }
};

// Recursively walks the uploads directory and returns list of physical file objects
const walkUploadsDir = async (dirPath, baseDir) => {
  let fileList = [];
  if (!fs.existsSync(dirPath)) return fileList;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const sub = await walkUploadsDir(fullPath, baseDir);
      fileList = fileList.concat(sub);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const validExtensions = [".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif", ".pdf"];
      if (validExtensions.includes(ext)) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const relative = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          fileList.push({
            filename: entry.name,
            fullPath,
            url: `/${relative}`,
            size: stats.size,
            mtime: stats.mtime,
          });
        } catch {
          // ignore stat errors
        }
      }
    }
  }
  return fileList;
};

// Extracts all media paths referenced in active database documents
export const getAllReferencedMediaUrls = async () => {
  const referencedSet = new Set(PROTECTED_SYSTEM_PATHS);

  // 1. Scan Product images
  const products = await ProductModel.find(
    {},
    { imageUrl: 1, thumbnailUrl: 1, images: 1, variants: 1, metaData: 1 }
  ).lean();

  for (const prod of products) {
    collectUrl(prod.imageUrl, referencedSet);
    collectUrl(prod.thumbnailUrl, referencedSet);
    if (Array.isArray(prod.images)) {
      prod.images.forEach((img) => collectUrl(img, referencedSet));
    }
    if (Array.isArray(prod.variants)) {
      prod.variants.forEach((v) => collectUrl(v.imageUrl, referencedSet));
    }
    if (prod.metaData?.ogImage) {
      collectUrl(prod.metaData.ogImage, referencedSet);
    }
  }

  // 2. Scan Category images
  const categories = await CategoryModel.find({}, { imageUrl: 1, iconUrl: 1 }).lean();
  for (const cat of categories) {
    collectUrl(cat.imageUrl, referencedSet);
    collectUrl(cat.iconUrl, referencedSet);
  }

  // 3. Scan Brand images
  const brands = await BrandModel.find({}, { imageUrl: 1, logoUrl: 1 }).lean();
  for (const brand of brands) {
    collectUrl(brand.imageUrl, referencedSet);
    collectUrl(brand.logoUrl, referencedSet);
  }

  return referencedSet;
};

// Runs orphan identification scan, records findings in DB, and dispatches an audit log notification
export const runOrphanMediaScan = async (triggeredBy = "SYSTEM") => {
  logger.info({ triggeredBy }, "[MediaAudit] Starting orphan media identification scan");

  const referencedUrls = await getAllReferencedMediaUrls();
  const uploadsDir = path.join(process.cwd(), "uploads");
  const physicalFiles = await walkUploadsDir(uploadsDir, process.cwd());

  const existingAudits = await MediaCleanupAuditModel.find({}).lean();
  const auditMap = new Map(existingAudits.map((a) => [a.filePath, a]));

  const orphanCandidates = [];
  let newOrphansCount = 0;
  let totalReclaimableBytes = 0;

  for (const file of physicalFiles) {
    // Check if referenced in database or hardcoded protected set
    if (referencedUrls.has(file.url)) {
      continue;
    }

    const existing = auditMap.get(file.url);
    if (existing) {
      // If already whitelisted or deleted, skip
      if (existing.status === "WHITELISTED" || existing.status === "DELETED") {
        continue;
      }
      orphanCandidates.push(existing);
      totalReclaimableBytes += file.size;
    } else {
      // Record new orphan candidate
      const auditRecord = await MediaCleanupAuditModel.create({
        filePath: file.url,
        filename: file.filename,
        fileSize: file.size,
        status: "PENDING_REVIEW",
      });
      orphanCandidates.push(auditRecord);
      newOrphansCount++;
      totalReclaimableBytes += file.size;
    }
  }

  // If new orphan candidates are found, create an unread notification log for Admins
  if (newOrphansCount > 0) {
    const sizeMb = (totalReclaimableBytes / (1024 * 1024)).toFixed(2);
    await LogModel.create({
      type: "updated",
      typeDid: "121",
      description: `Media Cleanup Notice: Identified ${newOrphansCount} unused orphan image(s) (~${sizeMb} MB) ready for admin review.`,
      readStatus: false,
      createdBy: triggeredBy,
    });
    logger.warn(
      { newOrphansCount, totalReclaimableBytes },
      `[MediaAudit] Identified ${newOrphansCount} orphan image(s)`
    );
  }

  return {
    totalFilesScanned: physicalFiles.length,
    activeReferencedCount: referencedUrls.size,
    orphanCount: orphanCandidates.length,
    newOrphansCount,
    totalReclaimableBytes,
    candidates: orphanCandidates,
  };
};

// Permanently deletes confirmed orphan files from VPS disk storage
export const deleteOrphanFiles = async (filePaths = [], reviewerDid = null) => {
  const uploadsDir = process.cwd();
  let deletedCount = 0;
  let deletedBytes = 0;

  for (const filePath of filePaths) {
    const cleanRelative = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const fullDiskPath = path.join(uploadsDir, cleanRelative);

    try {
      if (fs.existsSync(fullDiskPath)) {
        const stats = await fs.promises.stat(fullDiskPath);
        await fs.promises.unlink(fullDiskPath);
        deletedBytes += stats.size;
      }

      await MediaCleanupAuditModel.findOneAndUpdate(
        { filePath },
        {
          status: "DELETED",
          reviewedBy: reviewerDid,
          reviewedAt: new Date(),
        },
        { upsert: true }
      );
      deletedCount++;
    } catch (err) {
      logger.error({ err, filePath }, `[MediaAudit] Failed to delete orphan file ${filePath}`);
    }
  }

  if (deletedCount > 0) {
    const sizeMb = (deletedBytes / (1024 * 1024)).toFixed(2);
    await LogModel.create({
      type: "deleted",
      typeDid: "666",
      description: `Media Cleanup: Admin permanently deleted ${deletedCount} orphan file(s) reclaiming ${sizeMb} MB.`,
      readStatus: false,
      createdBy: reviewerDid,
    });
  }

  return { deletedCount, deletedBytes };
};
