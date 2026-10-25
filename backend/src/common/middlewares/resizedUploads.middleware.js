import sharp from "sharp";
import path from "path";
import fs from "fs";

// Card-size copies of uploaded images: GET /uploads-resized/600/<path under uploads>.
// Browsers shrinking a 1200px upload ~4x into a product card render jagged edges, so cards
// ask for a copy made once with sharp's Lanczos resize and cached on disk (outside uploads/,
// so it stays out of the media library and upload backups).
const ALLOWED_WIDTHS = new Set([600]);
const IMAGE_EXT = /\.(webp|jpe?g|png)$/i;

const uploadsRoot = path.join(process.cwd(), "uploads");
const cacheRoot = path.join(process.cwd(), ".cache", "resized-uploads");

// Concurrent requests for the same copy share one sharp job
const pendingJobs = new Map();

const buildResizedCopy = async (sourcePath, cachePath, width) => {
  await fs.promises.mkdir(path.dirname(cachePath), { recursive: true });
  const tmpPath = `${cachePath}.${process.pid}.tmp`;
  await sharp(sourcePath)
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(tmpPath);
  await fs.promises.rename(tmpPath, cachePath);
};

export const resizedUploadsRoute = /^\/uploads-resized\/(\d+)\/(.+)$/;

export const resizedUploadsHandler = async (req, res) => {
  const width = Number(req.params[0]);
  let relPath;
  try {
    relPath = decodeURIComponent(req.params[1]);
  } catch {
    return res.status(400).end();
  }

  if (!ALLOWED_WIDTHS.has(width) || !IMAGE_EXT.test(relPath)) {
    return res.status(404).end();
  }

  const sourcePath = path.resolve(uploadsRoot, relPath);
  if (!sourcePath.startsWith(uploadsRoot + path.sep)) {
    return res.status(404).end();
  }

  let sourceStat;
  try {
    sourceStat = await fs.promises.stat(sourcePath);
  } catch {
    return res.status(404).end();
  }

  // Build the cache path from the normalized path so "../" in the URL can't escape the cache folder
  const safeRelPath = path.relative(uploadsRoot, sourcePath);
  const cachePath = path.join(cacheRoot, `w${width}`, safeRelPath).replace(IMAGE_EXT, ".webp");

  try {
    const cacheStat = await fs.promises.stat(cachePath).catch(() => null);
    // Rebuild when the source was replaced in place (CMS assets keep their filename)
    if (!cacheStat || cacheStat.mtimeMs < sourceStat.mtimeMs) {
      if (!pendingJobs.has(cachePath)) {
        pendingJobs.set(cachePath, buildResizedCopy(sourcePath, cachePath, width).finally(() => pendingJobs.delete(cachePath)));
      }
      await pendingJobs.get(cachePath);
    }
  } catch {
    return res.status(500).end();
  }

  const isCmsAsset = safeRelPath.startsWith("assets");
  res.setHeader("Cache-Control", isCmsAsset ? "no-cache, must-revalidate" : "public, max-age=604800");
  res.type("image/webp");
  // The cache lives under ".cache", which sendFile refuses unless dotfiles are allowed
  return res.sendFile(cachePath, { dotfiles: "allow" });
};
