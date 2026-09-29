import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";

import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

const storage = multer.memoryStorage();

// Middleware: Restricts upload size up to 100MB for video and image assets
export const assetUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max upload limit (supports video)
  },
  fileFilter: (req, file, cb) => {
    if (
      !file.mimetype.startsWith("image/") &&
      !file.mimetype.startsWith("video/") &&
      !file.originalname.endsWith(".ico")
    ) {
      return cb(new Error("Only image and video files are allowed!"), false);
    }
    cb(null, true);
  },
}).single("file");

// Helper: Formats file size in readable KB / MB
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Helper: Compresses image buffer to WebP targeting <= 230KB while preserving 100% original resolution
const compressToTargetWebP = async (inputBuffer, targetMaxBytes = 230 * 1024) => {
  let quality = 85;

  let outputBuffer = await sharp(inputBuffer)
    .webp({
      quality,
      effort: 6,
      smartSubsample: true,
      reductionEffort: 6,
    })
    .toBuffer();

  while (outputBuffer.length > targetMaxBytes && quality > 45) {
    quality -= 6;
    outputBuffer = await sharp(inputBuffer)
      .webp({
        quality,
        effort: 6,
        smartSubsample: true,
        reductionEffort: 6,
      })
      .toBuffer();
  }

  return outputBuffer;
};

// Helper: Compresses video buffer using ffmpeg with H.264 CRF 26 + AAC while preserving visual quality and web streaming
const compressVideoWithFFmpeg = async (inputBuffer, destinationPath) => {
  const tempInputPath = path.join(
    os.tmpdir(),
    `upload_video_${Date.now()}_${Math.random().toString(36).substring(7)}.tmp`
  );
  const tempOutputPath = path.join(
    os.tmpdir(),
    `compressed_video_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`
  );

  try {
    await fs.promises.writeFile(tempInputPath, inputBuffer);

    // Run ffmpeg:
    // -c:v libx264 -crf 26 -preset medium: excellent compression with high visual fidelity
    // -pix_fmt yuv420p: universal browser compatibility
    // -movflags +faststart: allows instant web playback without downloading the whole file first
    // -c:a aac -b:a 128k: high quality stereo audio
    // -vf "scale='min(1920,iw)':-2": caps maximum resolution at 1080p full HD
    const args = [
      "-y",
      "-i", tempInputPath,
      "-c:v", "libx264",
      "-crf", "26",
      "-preset", "medium",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "128k",
      "-vf", "scale='min(1920,iw)':-2",
      tempOutputPath,
    ];

    await execFileAsync("ffmpeg", args);

    // Move compressed video to destination path
    await fs.promises.copyFile(tempOutputPath, destinationPath);
  } catch (err) {
    // If ffmpeg fails (or isn't installed locally), fallback to writing original buffer safely
    console.warn("[dashAssets] ffmpeg compression failed or not available, writing original file:", err.message);
    await fs.promises.writeFile(destinationPath, inputBuffer);
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempInputPath)) await fs.promises.unlink(tempInputPath);
      if (fs.existsSync(tempOutputPath)) await fs.promises.unlink(tempOutputPath);
    } catch (_) {}
  }
};

// Removes solid or near-solid backgrounds from logo buffer with feathering and trims borders
const removeImageBackground = async (inputBuffer) => {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let opaqueCount = 0;
  let darkCount = 0;
  let lightCount = 0;

  for (let i = 0; i < data.length; i += channels) {
    const a = data[i + 3];
    if (a > 20) {
      opaqueCount++;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      if (maxC < 55) darkCount++;
      if (minC > 215) lightCount++;
    }
  }

  const isDarkBg = opaqueCount > 0 && (darkCount / opaqueCount > 0.2);
  const isLightBg = opaqueCount > 0 && (lightCount / opaqueCount > 0.2);

  if (isDarkBg) {
    for (let i = 0; i < data.length; i += channels) {
      const a = data[i + 3];
      if (a === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const maxC = Math.max(r, g, b);
      if (maxC <= 50) {
        data[i + 3] = 0;
      } else if (maxC < 85) {
        data[i + 3] = Math.round(a * ((maxC - 50) / 35));
      }
    }
  } else if (isLightBg) {
    for (let i = 0; i < data.length; i += channels) {
      const a = data[i + 3];
      if (a === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const minC = Math.min(r, g, b);
      if (minC >= 235) {
        data[i + 3] = 0;
      } else if (minC > 200) {
        data[i + 3] = Math.round(a * ((235 - minC) / 35));
      }
    }
  }

  return await sharp(data, { raw: { width, height, channels } })
    .trim()
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
};

// Helper: Resolves absolute filesystem path of uploads/assets directory
const getAssetsDirectory = async () => {
  const assetsDir = path.join(process.cwd(), "uploads", "assets");
  await fs.promises.mkdir(assetsDir, { recursive: true });
  return assetsDir;
};

/**
 * Controller: Lists all available asset files located in /uploads/assets directory.
 * Path: GET /api/v1/dash/assets
 */
export const listAssets = async (req, res, next) => {
  try {
    const assetsDir = await getAssetsDirectory();
    const entries = await fs.promises.readdir(assetsDir, { withFileTypes: true });

    const assets = [];
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(assetsDir, entry.name);
        const stats = await fs.promises.stat(filePath);
        assets.push({
          filename: entry.name,
          relativePath: `/uploads/assets/${entry.name}`,
          url: `/uploads/assets/${entry.name}?v=${stats.mtimeMs}`,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          updatedAt: stats.mtime,
        });
      }
    }

    // Sort by recent modification time
    assets.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      status: "success",
      data: assets,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Uploads, converts to WebP, and saves/overwrites asset into fixed slot filename.
 * Path: POST /api/v1/dash/assets/upload-slot
 */
export const uploadSlotAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No image file provided for upload",
      });
    }

    const rawTargetName = (req.body.targetFilename || req.body.slotKey || "").trim();
    if (!rawTargetName) {
      return res.status(400).json({
        status: "error",
        message: "targetFilename or slotKey is required",
      });
    }

    let cleanBaseName = rawTargetName.replace(/[^a-zA-Z0-9._-]/g, "");
    const isLogo = req.body.slotKey === "logo" || cleanBaseName.toLowerCase().includes("logo");
    
    let targetFilename = cleanBaseName;
    const isVideo =
      req.file.mimetype.startsWith("video/") ||
      cleanBaseName.endsWith(".mp4") ||
      cleanBaseName.endsWith(".webm") ||
      cleanBaseName.endsWith(".mov") ||
      req.body.slotKey?.toLowerCase().includes("video");

    const isIco = cleanBaseName.endsWith(".ico") || req.file.mimetype === "image/x-icon";
    const isSvg = cleanBaseName.endsWith(".svg") || req.file.mimetype === "image/svg+xml";

    if (isVideo) {
      // Standardize promo videos to MP4 format for universal web playback
      if (!cleanBaseName.toLowerCase().endsWith(".mp4")) {
        cleanBaseName = cleanBaseName.replace(/\.[^/.]+$/, "");
        targetFilename = `${cleanBaseName}.mp4`;
      }
    } else if (!isIco && !isSvg) {
      if (isLogo) {
        targetFilename = "logo.webp";
      } else if (!cleanBaseName.toLowerCase().endsWith(".webp")) {
        cleanBaseName = cleanBaseName.replace(/\.[^/.]+$/, "");
        targetFilename = `${cleanBaseName}.webp`;
      }
    }

    const assetsDir = await getAssetsDirectory();
    const destinationPath = path.join(assetsDir, targetFilename);

    if (isVideo) {
      await compressVideoWithFFmpeg(req.file.buffer, destinationPath);
    } else if (isIco || isSvg) {
      await fs.promises.writeFile(destinationPath, req.file.buffer);
    } else if (isLogo) {
      const backgroundlessBuffer = await removeImageBackground(req.file.buffer);
      const webpBuffer = await compressToTargetWebP(backgroundlessBuffer, 230 * 1024);
      await fs.promises.writeFile(destinationPath, webpBuffer);
    } else {
      const webpBuffer = await compressToTargetWebP(req.file.buffer, 230 * 1024);
      await fs.promises.writeFile(destinationPath, webpBuffer);
    }

    const stats = await fs.promises.stat(destinationPath);

    res.json({
      status: "success",
      message: `Asset ${targetFilename} saved successfully!`,
      data: {
        filename: targetFilename,
        relativePath: `/uploads/assets/${targetFilename}`,
        url: `/uploads/assets/${targetFilename}?v=${stats.mtimeMs}`,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        updatedAt: stats.mtime,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Deletes an asset file from /uploads/assets directory.
 * Path: DELETE /api/v1/dash/assets/:filename
 */
export const deleteAsset = async (req, res, next) => {
  try {
    const rawFilename = (req.params.filename || "").trim();
    if (!rawFilename) {
      return res.status(400).json({
        status: "error",
        message: "Filename parameter is required",
      });
    }

    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(rawFilename);
    const assetsDir = await getAssetsDirectory();
    const targetFilePath = path.join(assetsDir, sanitizedFilename);

    if (fs.existsSync(targetFilePath)) {
      await fs.promises.unlink(targetFilePath);
    }

    res.json({
      status: "success",
      message: `Asset ${sanitizedFilename} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Downloads an asset file as an attachment.
 * Path: GET /api/v1/dash/assets/download/:filename
 */
export const downloadAsset = async (req, res, next) => {
  try {
    const rawFilename = (req.params.filename || "").trim();
    const sanitizedFilename = path.basename(rawFilename);
    const assetsDir = await getAssetsDirectory();
    const targetFilePath = path.join(assetsDir, sanitizedFilename);

    if (!fs.existsSync(targetFilePath)) {
      return res.status(404).json({
        status: "error",
        message: "Asset file not found",
      });
    }

    res.download(targetFilePath, sanitizedFilename);
  } catch (err) {
    next(err);
  }
};
