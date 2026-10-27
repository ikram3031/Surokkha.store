import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { CMSContentModel } from "../../common/models/cmsContent.model.js";
import { CMSContentTypeModel, seedCmsContentTypes } from "../../common/models/cmsContentType.model.js";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Middleware: accepts a single image up to 10MB in memory for slide uploads
export const cmsImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed!"), false);
    cb(null, true);
  },
}).single("file");

const str = (v) => (typeof v === "string" ? v.trim() : "");

// Section names become file names, so keep them URL-safe (e.g. "Safe Use" -> "safe-use")
const slugifyName = (v) =>
  str(v)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const WEBP_MAX_WIDTH = 2400;
const WEBP_START_QUALITY = 90;
const WEBP_MIN_QUALITY = 74;
const WEBP_SOFT_LIMIT_BYTES = 450 * 1024;

// High-quality WebP: starts at q90 and only steps down if the file grows unreasonably large
export const encodeHighQualityWebp = async (input) => {
  const base = sharp(input).rotate().resize({ width: WEBP_MAX_WIDTH, withoutEnlargement: true });
  let quality = WEBP_START_QUALITY;
  let buffer;
  do {
    buffer = await base.clone().webp({ quality, effort: 6 }).toBuffer();
    quality -= 4;
  } while (buffer.length > WEBP_SOFT_LIMIT_BYTES && quality >= WEBP_MIN_QUALITY);
  return { buffer, quality: quality + 4 };
};

// Normalises one slide payload to the allowed schema fields
const sanitizeSlide = (raw = {}, index = 0) => ({
  ...(raw._id && /^[0-9a-fA-F]{24}$/.test(raw._id) ? { _id: raw._id } : {}),
  isActive: raw.isActive !== false,
  order: index,
  badge: str(raw.badge),
  titleDark: str(raw.titleDark),
  titleAccent: str(raw.titleAccent),
  tagline: (Array.isArray(raw.tagline) ? raw.tagline : []).map(str).filter(Boolean),
  subtitle: str(raw.subtitle),
  chips: (Array.isArray(raw.chips) ? raw.chips : [])
    .map((c) => ({ label: str(c?.label), color: str(c?.color) || "#e05578" }))
    .filter((c) => c.label),
  ctaLabel: str(raw.ctaLabel),
  ctaLink: str(raw.ctaLink),
  ctaNote: str(raw.ctaNote),
  footnote: str(raw.footnote),
  image: str(raw.image),
  imageAlt: str(raw.imageAlt),
});

// Clamps a numeric setting into its allowed range
const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

// Builds a safe CMSContent document body from the request payload
const buildPayload = (body = {}) => {
  const settings = body.settings || {};
  return {
    name: str(body.name),
    page: str(body.page).toLowerCase() || "home",
    site: body.site === "store" ? "store" : "shop",
    type: str(body.type).toLowerCase(),
    isActive: body.isActive !== false,
    settings: {
      autoplay: settings.autoplay !== false,
      speedMs: clampNum(settings.speedMs, 1000, 60000, 5000),
      transitionMs: clampNum(settings.transitionMs, 100, 5000, 700),
      pauseOnHover: settings.pauseOnHover !== false,
      showArrows: settings.showArrows !== false,
      showDots: settings.showDots !== false,
    },
    items: (Array.isArray(body.items) ? body.items : []).map(sanitizeSlide),
  };
};

// Lists CMS content types, seeding the built-in ones first
export const listCmsContentTypes = async (req, res, next) => {
  try {
    await seedCmsContentTypes();
    const data = await CMSContentTypeModel.find().sort({ createdAt: 1 }).lean();
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

// Lists CMS content documents filtered by type, page and site
export const listCmsContents = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = String(req.query.type).toLowerCase();
    if (req.query.page) filter.page = String(req.query.page).toLowerCase();
    if (req.query.site) filter.site = req.query.site === "store" ? "store" : "shop";
    const data = await CMSContentModel.find(filter).sort({ updatedAt: -1 }).lean();
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

// Fetches a single CMS content document by id
export const getCmsContent = async (req, res, next) => {
  try {
    const doc = await CMSContentModel.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ status: "error", message: "Content not found" });
    res.json({ status: "success", data: doc });
  } catch (err) {
    next(err);
  }
};

// Creates a CMS content document after validating its type exists
export const createCmsContent = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.name) return res.status(400).json({ status: "error", message: "Name is required" });
    await seedCmsContentTypes();
    const typeDoc = await CMSContentTypeModel.findOne({ key: payload.type, isActive: true }).lean();
    if (!typeDoc) return res.status(400).json({ status: "error", message: "Invalid content type" });
    const doc = await CMSContentModel.create({ ...payload, createdBy: req.user?._id || null, updatedBy: req.user?._id || null });
    res.status(201).json({ status: "success", message: "Content created", data: doc });
  } catch (err) {
    next(err);
  }
};

// Updates a CMS content document in place
export const updateCmsContent = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.name) return res.status(400).json({ status: "error", message: "Name is required" });
    const typeDoc = await CMSContentTypeModel.findOne({ key: payload.type, isActive: true }).lean();
    if (!typeDoc) return res.status(400).json({ status: "error", message: "Invalid content type" });
    const doc = await CMSContentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { ...payload, updatedBy: req.user?._id || null } },
      { new: true, runValidators: true },
    ).lean();
    if (!doc) return res.status(404).json({ status: "error", message: "Content not found" });
    res.json({ status: "success", message: "Content saved", data: doc });
  } catch (err) {
    next(err);
  }
};

// Deletes a CMS content document
export const deleteCmsContent = async (req, res, next) => {
  try {
    const doc = await CMSContentModel.findByIdAndDelete(req.params.id).lean();
    if (!doc) return res.status(404).json({ status: "error", message: "Content not found" });
    res.json({ status: "success", message: "Content deleted" });
  } catch (err) {
    next(err);
  }
};

// Converts an uploaded CMS image to high-quality WebP, saves it under its section name and returns its public path
export const uploadCmsImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ status: "error", message: "No image file provided" });
    const dir = path.join(process.cwd(), "uploads", "cms");
    await fs.promises.mkdir(dir, { recursive: true });
    // A "name" field (e.g. the section key) names the file; without one it is a timestamped slide image
    const name = slugifyName(req.body?.name);
    const filename = name ? `${name}.webp` : `slide-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.webp`;
    const { buffer, quality } = await encodeHighQualityWebp(req.file.buffer);
    await fs.promises.writeFile(path.join(dir, filename), buffer);
    // Same name overwrites the old file, so the version query busts browser/CDN caches
    res.json({
      status: "success",
      data: { path: `/uploads/cms/${filename}?v=${Date.now()}`, filename, size: buffer.length, quality },
    });
  } catch (err) {
    next(err);
  }
};
