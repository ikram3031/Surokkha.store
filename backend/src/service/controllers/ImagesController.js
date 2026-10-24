import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { LogModel } from "../../common/models/log.model.js";

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single("image");

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yearMonthFolder = `${yy}${mm}`;
    const dayFolder = `${yy}${mm}${dd}`;
    const dateFolder = `${yearMonthFolder}/${dayFolder}`; // Format folder as YYMM/YYMMDD (e.g. 2608/260813)

    const destinationDir = path.join(process.cwd(), "uploads", yearMonthFolder, dayFolder);

    // Ensure the directory exists
    await fs.promises.mkdir(destinationDir, { recursive: true });

    // Generate unique slugified filenames
    const originalName = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname),
    );
    const slugName =
      originalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "image";
    const timestamp = Date.now();

    const isProduct =
      req.body.type === "product" || req.query.type === "product";
    const isAttribute =
      req.body.type === "attribute" || req.query.type === "attribute";

    if (isAttribute) {
      const attributeDir = path.join(process.cwd(), "uploads", "assets", "attributes");
      await fs.promises.mkdir(attributeDir, { recursive: true });

      const attrName = (req.body.attributeSlug || req.body.attributeName || "attr")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const valName = (req.body.valueSlug || req.body.valueName || slugName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      const filename = `${attrName}_${valName}_${timestamp}.webp`;
      const filePath = path.join(attributeDir, filename);

      // Process image: 1:1 Square, max 1000x1000px, high-quality WebP
      await sharp(req.file.buffer)
        .rotate()
        .resize({
          width: 1000,
          height: 1000,
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 90 })
        .toFile(filePath);

      const imageUrl = `/uploads/assets/attributes/${filename}`;

      return res.status(200).json({
        status: "success",
        data: {
          imageUrl,
        },
      });
    }

    if (isProduct) {
      const productSlug = req.body.productSlug || req.query.productSlug;
      const variantName = req.body.variantName || req.query.variantName;

      let mainFilename;
      let thumbFilename;

      const cleanSlug = productSlug
        ? String(productSlug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        : "";

      if (cleanSlug) {
        if (variantName) {
          const cleanVariant = String(variantName).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
          mainFilename = `${cleanSlug}_${cleanVariant}_${timestamp}.webp`;
          thumbFilename = `thumb_${cleanSlug}_${cleanVariant}_${timestamp}.webp`;
        } else {
          mainFilename = `${cleanSlug}_main_${timestamp}.webp`;
          thumbFilename = `thumb_${cleanSlug}_main_${timestamp}.webp`;
        }
      } else {
        mainFilename = `product_${slugName}_${timestamp}.webp`;
        thumbFilename = `thumb_${slugName}_${timestamp}.webp`;
      }

      const mainFilePath = path.join(destinationDir, mainFilename);
      const thumbFilePath = path.join(destinationDir, thumbFilename);

      // Process main image: Max 1200x1200px
      await sharp(req.file.buffer)
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toFile(mainFilePath);

      // Process thumbnail image: Max 200x200px
      await sharp(req.file.buffer)
        .rotate()
        .resize({
          width: 200,
          height: 200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toFile(thumbFilePath);

      // Construct public URLs
      const mainUrl = `/uploads/${dateFolder}/${mainFilename}`;
      const thumbUrl = `/uploads/${dateFolder}/${thumbFilename}`;

      return res.status(200).json({
        status: "success",
        data: {
          imageUrl: mainUrl,
          thumbnailUrl: thumbUrl,
        },
      });
    } else {
      const filename = `image_${slugName}_${timestamp}.webp`;
      const filePath = path.join(destinationDir, filename);

      // Process image without resizing or with large default limit (e.g. max 1920 width)
      await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(filePath);

      const imageUrl = `/uploads/${dateFolder}/${filename}`;

      return res.status(200).json({
        status: "success",
        data: {
          imageUrl,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Helper: Recursively find all media files inside /uploads directory
async function getAllUploadFiles(dirPath, baseDir) {
  let results = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await getAllUploadFiles(fullPath, baseDir);
      results = results.concat(nested);
    } else {
      // Skip 200px thumbnails: they duplicate every product image and look blurry in the picker
      if (entry.name.startsWith("thumb_")) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const validExtensions = [".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif", ".pdf"];
      if (validExtensions.includes(ext)) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          results.push({
            filename: entry.name,
            url: `/${relativePath}`,
            size: stats.size,
            createdAt: stats.birthtime || stats.mtime,
            updatedAt: stats.mtime,
          });
        } catch {
          // ignore inaccessible file stats
        }
      }
    }
  }
  return results;
}

// List all media files from uploads folder with pagination and search
export const listAllMedia = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : "";

    const uploadsDir = path.join(process.cwd(), "uploads");
    const allFiles = await getAllUploadFiles(uploadsDir, process.cwd());

    // Sort by latest created/modified date first (descending)
    allFiles.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    // Filter by search query if provided
    const filteredFiles = search
      ? allFiles.filter((f) => f.filename.toLowerCase().includes(search) || f.url.toLowerCase().includes(search))
      : allFiles;

    const total = filteredFiles.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filteredFiles.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      status: "success",
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete media files from /uploads (Owner/Admin only) and record an activity log
export const bulkDeleteMedia = async (req, res, next) => {
  try {
    const urls = Array.isArray(req.body?.urls) ? req.body.urls.filter((u) => typeof u === "string") : [];
    if (urls.length === 0) {
      return res.status(400).json({ status: "error", message: "No files selected" });
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    const deleted = [];
    const failed = [];
    let deletedBytes = 0;

    const unlinkIfExists = async (fullPath) => {
      if (!fs.existsSync(fullPath)) return 0;
      const stats = await fs.promises.stat(fullPath);
      await fs.promises.unlink(fullPath);
      return stats.size;
    };

    for (const url of urls) {
      const relative = url.replace(/^\/+/, "");
      const fullPath = path.resolve(process.cwd(), relative);
      // Only allow files inside /uploads (blocks ../ path traversal)
      if (!fullPath.startsWith(uploadsDir + path.sep)) {
        failed.push(url);
        continue;
      }
      try {
        const size = await unlinkIfExists(fullPath);
        if (!size) {
          failed.push(url);
          continue;
        }
        deletedBytes += size;
        deleted.push(url);

        // Remove the hidden thumbnail that was generated alongside a product image
        const dir = path.dirname(fullPath);
        const name = path.basename(fullPath);
        const thumbNames = [`thumb_${name}`];
        if (name.startsWith("product_")) thumbNames.push(`thumb_${name.slice("product_".length)}`);
        for (const thumb of thumbNames) {
          deletedBytes += await unlinkIfExists(path.join(dir, thumb)).catch(() => 0);
        }
      } catch {
        failed.push(url);
      }
    }

    if (deleted.length > 0) {
      try {
        const actorName = req.user?.name || req.user?.email || "Admin";
        const actorDid = req.user?.did || req.user?.userId || "system";
        const sizeMb = (deletedBytes / (1024 * 1024)).toFixed(2);
        const names = deleted.map((u) => path.basename(u));
        const preview = names.slice(0, 10).join(", ") + (names.length > 10 ? ` and ${names.length - 10} more` : "");
        await LogModel.create({
          type: "deleted",
          typeDid: "media",
          description: `${actorName} deleted ${deleted.length} media file(s) (${sizeMb} MB) from Media Library: ${preview}`,
          readStatus: false,
          active: true,
          createdBy: actorDid,
          updatedBy: actorDid,
        });
      } catch (logErr) {
        console.warn("Failed to create log for media delete:", logErr);
      }
    }

    return res.status(200).json({
      status: "success",
      message: `${deleted.length} file(s) deleted`,
      data: { deleted, failed },
    });
  } catch (error) {
    next(error);
  }
};
