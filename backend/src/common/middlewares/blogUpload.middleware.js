import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { slugify } from "../utils/blogSeo.js";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

// Returns the two-digit year and month used to group uploads, e.g. { year: "26", month: "10" }
const getFolderParts = (date = new Date()) => ({
  year: String(date.getFullYear()).slice(-2),
  month: String(date.getMonth() + 1).padStart(2, "0"),
});

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const { year, month } = getFolderParts();
    const targetDir = path.join(process.cwd(), "uploads", "blog", year, month);
    try {
      fs.mkdirSync(targetDir, { recursive: true });
      req.blogUploadPath = `/uploads/blog/${year}/${month}`;
      cb(null, targetDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".webp";
    const base = slugify(path.basename(file.originalname, path.extname(file.originalname))) || "image";
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    return cb(Object.assign(new Error("Only JPG, PNG, WebP, AVIF or GIF images are allowed"), { statusCode: 400 }));
  },
});

// Shrinks oversized images in place, leaving animated GIFs untouched
const compressImage = async (file) => {
  if (file.mimetype === "image/gif") return;
  const output = await sharp(file.path).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true }).toBuffer();
  await fs.promises.writeFile(file.path, output);
};

// Saves one blog image under uploads/blog/YY/MM and sets req.file.url
export const blogUpload = (fieldName = "image") => (req, res, next) => {
  multerUpload.single(fieldName)(req, res, async (err) => {
    if (err) {
      const status = err.statusCode || (err.code === "LIMIT_FILE_SIZE" ? 413 : 400);
      const message = err.code === "LIMIT_FILE_SIZE" ? "Image is larger than 8 MB" : err.message;
      return res.status(status).json({ status: "error", message });
    }
    if (!req.file) return next();

    try {
      await compressImage(req.file);
      req.file.url = `${req.blogUploadPath}/${req.file.filename}`;
      return next();
    } catch (error) {
      return next(error);
    }
  });
};
