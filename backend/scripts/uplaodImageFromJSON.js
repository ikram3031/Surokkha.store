import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { connectDatabase, closeDatabase } from "../src/common/database/index.js";
import { ProductModel } from "../src/common/models/product.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const imgDir = path.join(projectRoot, "img");
const outputUploadsDir = path.join(projectRoot, "src", "uploads");

// The JSON file containing the list of products with failed images
const failedJsonPath = path.resolve(projectRoot, "scripts", "failed-product-images.json");
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];
const sourceSizeThreshold = 100 * 1024;
const targetMainFileSize = 200 * 1024;
const targetThumbFileSize = 200 * 1024;

const getBatchFolderName = () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  return `${dateStr}010010`;
};

const slugify = (text) => {
  if (!text) return "product";
  return text
    .toString()
    .normalize("NFD") // ô → o + combining accent, é → e + accent
    .replace(/[\u0300-\u036f]/g, "") // remove combining diacritical marks
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // Remove everything inside parentheses, including parentheses e.g. "(jpg)" -> ""
    .replace(/\[[^\]]*\]/g, "") // Remove everything inside brackets e.g. "[jpg]" -> ""
    .replace(/['"’`”“]/g, "") // Remove apostrophes and quotes completely so "Victoria's" becomes "victorias"
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const convertToWebp = async (sourcePath, destPath, { maxSize = 1200, fit = "inside", targetMaxBytes = 200 * 1024 } = {}) => {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const tempFile = `${destPath}.tmp`;
  const sourceStats = await fs.promises.stat(sourcePath);
  const qualities = sourceStats.size < sourceSizeThreshold ? [100] : [90, 80];

  for (const quality of qualities) {
    await sharp(sourcePath)
      .rotate()
      .resize({
        width: maxSize,
        height: maxSize,
        fit,
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toFile(tempFile);

    const outputStats = await fs.promises.stat(tempFile);
    const shouldUseCurrent = outputStats.size <= targetMaxBytes || quality === qualities[qualities.length - 1];

    if (shouldUseCurrent) {
      await fs.promises.rename(tempFile, destPath);
      return { destPath, quality, size: outputStats.size };
    }

    await fs.promises.unlink(tempFile).catch(() => {});
  }

  return { destPath, quality: qualities[qualities.length - 1], size: 0 };
};

const findImageFileForProduct = (productSlug, files) => {
  return files.find((file) => {
    const ext = path.extname(file).toLowerCase();
    if (!allowedExtensions.includes(ext)) return false;
    return slugify(path.basename(file, ext)) === productSlug;
  });
};

const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
};

const readFailedEntries = async () => {
  if (!fs.existsSync(failedJsonPath)) {
    return [];
  }

  const raw = await fs.promises.readFile(failedJsonPath, "utf-8");
  if (!raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFailedEntries = async (entries) => {
  await fs.promises.writeFile(failedJsonPath, JSON.stringify(entries, null, 2), "utf-8");
};

const run = async () => {
  if (!fs.existsSync(imgDir)) {
    console.error(`Image folder not found: ${imgDir}`);
    process.exit(1);
  }

  const pendingEntries = await readFailedEntries();
  if (pendingEntries.length === 0) {
    console.log("No pending products found in failed-product-images.json");
    return;
  }

  await connectDatabase();

  const files = getAllFiles(imgDir);
  let success = 0;
  let failed = 0;
  const remainingEntries = [];
  const baseBatchFolder = getBatchFolderName().slice(0, -2);

  for (const entry of pendingEntries) {
    const name = entry.name || entry.productName || entry.slug || entry.title || "";
    const did = entry.did || entry.id || entry._id || "";
    const productSlug = slugify(name);

    if (!name) {
      remainingEntries.push(entry);
      failed += 1;
      continue;
    }

    const imageFilePath = findImageFileForProduct(productSlug, files);

    if (!imageFilePath) {
      failed += 1;
      remainingEntries.push(entry);
      console.log(`✖ ${productSlug} -> image not found in img folder/subfolders`);
      continue;
    }

    try {
      const fileBase = productSlug;
      const currentBatchIndex = Math.floor(success / 50) + 1;
      const batchFolder = `${baseBatchFolder}${String(currentBatchIndex).padStart(2, "0")}`;
      const identifier = did || `${Date.now()}-${success}`;
      const mainFileName = `product_${fileBase}_${identifier}.webp`;
      const thumbFileName = `thumb_${fileBase}_${identifier}.webp`;
      const mainDestPath = path.join(outputUploadsDir, batchFolder, mainFileName);
      const thumbDestPath = path.join(outputUploadsDir, batchFolder, thumbFileName);

      await convertToWebp(imageFilePath, mainDestPath, { maxSize: 1200, targetMaxBytes: targetMainFileSize });
      await convertToWebp(imageFilePath, thumbDestPath, { maxSize: 200, fit: "cover", targetMaxBytes: targetThumbFileSize });

      if (!fs.existsSync(mainDestPath) || !fs.existsSync(thumbDestPath)) {
        throw new Error("Converted images not found in uploads destination directory");
      }

      const imageUrl = `/uploads/${batchFolder}/${mainFileName}`;
      const thumbnailUrl = `/uploads/${batchFolder}/${thumbFileName}`;

      const query = did ? { $or: [{ did }, { name }] } : { name };
      const updateResult = await ProductModel.updateOne(query, { $set: { imageUrl, thumbnailUrl } });

      if (updateResult.matchedCount === 0) {
        throw new Error(`Product not found in database for: ${name}`);
      }

      success += 1;
      console.log(`✔ ${productSlug} -> updated successfully: ${imageUrl}`);
    } catch (err) {
      failed += 1;
      remainingEntries.push(entry);
      console.error(`✖ ${productSlug} failed:`, err.message || err);
    }
  }

  await writeFailedEntries(remainingEntries);

  console.log("\n=== Upload Summary ===");
  console.log(`Products checked: ${pendingEntries.length}`);
  console.log(`Succeeded: ${success}`);
  console.log(`Failed (left in json): ${failed}`);

  await closeDatabase();
};

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
