import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { authenticateToken } from "../../common/middlewares/auth.middleware.js";
import {
  ATTACHMENT_KINDS,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_EXTENSIONS,
} from "../../common/utils/accountAttachments.js";

const attachmentRouter = Router();
attachmentRouter.use(authenticateToken);

const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ATTACHMENT_MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (!ATTACHMENT_EXTENSIONS.includes(ext)) {
      return cb(new Error("This file type is not allowed. Use an image, PDF or office document."));
    }
    cb(null, true);
  },
}).single("file");

// Folder name is year + month, e.g. 2610 for October 2026
const monthFolder = () => {
  const now = new Date();
  return `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// POST /accounts/attachments/:kind (bills | payments) - stores one file under uploads/docs/<kind>/<YYMM>/
attachmentRouter.post("/:kind", (req, res, next) => {
  const { kind } = req.params;
  if (!ATTACHMENT_KINDS.includes(kind)) {
    return res.status(400).json({ status: "error", message: "Invalid attachment type" });
  }

  uploadSingle(req, res, async (err) => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large. Maximum size is 5 MB." : err.message;
      return res.status(400).json({ status: "error", message });
    }
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file provided" });
    }

    try {
      const folder = monthFolder();
      const ext = path.extname(req.file.originalname).toLowerCase();
      const baseName = path
        .basename(req.file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .slice(0, 40);
      const filename = `${baseName || "file"}-${crypto.randomBytes(6).toString("hex")}${ext}`;

      const targetDir = path.join(process.cwd(), "uploads", "docs", kind, folder);
      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.writeFile(path.join(targetDir, filename), req.file.buffer);

      return res.status(201).json({
        status: "success",
        data: {
          name: req.file.originalname,
          url: `/uploads/docs/${kind}/${folder}/${filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error) {
      next(error);
    }
  });
});

// DELETE /accounts/attachments/:kind/:folder/:filename - removes a file uploaded but not saved yet
attachmentRouter.delete("/:kind/:folder/:filename", async (req, res, next) => {
  try {
    const { kind, folder, filename } = req.params;
    if (!ATTACHMENT_KINDS.includes(kind) || !/^\d{4}$/.test(folder)) {
      return res.status(400).json({ status: "error", message: "Invalid attachment path" });
    }
    const target = path.join(process.cwd(), "uploads", "docs", kind, folder, path.basename(filename));
    await fs.promises.unlink(target).catch(() => {});
    return res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

export default attachmentRouter;
