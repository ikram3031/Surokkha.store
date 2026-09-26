import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { connectDatabase, closeDatabase } from '../src/common/database/index.js';
import { ProductModel } from '../src/common/models/product.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const imgDir = path.join(projectRoot, 'img');
const outputUploadsDir = path.join(projectRoot, 'src', 'uploads');
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

const hardcodedProducts = [
  {
    did: '1b6b393cfba729fc',
    name: "Lancome La Vie Est Belle L’Eau de Parfum",
    _id: '6a6488b100d5281346d54eb0',
    img: 'a1',
  },
];

const normalizeKey = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

const isAllowedImage = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
};

const findImageFile = async (imgKey) => {
  const files = await fs.promises.readdir(imgDir);

  const normalizedKey = normalizeKey(imgKey);

  return files.find((file) => {
    if (!isAllowedImage(file)) return false;

    const baseName = path.basename(file, path.extname(file));
    const normalizedFile = normalizeKey(baseName);

    return (
      normalizedFile === normalizedKey ||
      normalizedFile.includes(normalizedKey) ||
      normalizedKey.includes(normalizedFile)
    );
  });
};

const convertToWebp = async (sourcePath, destPath, { maxSize = 1200, quality = 85 } = {}) => {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const tmpPath = `${destPath}.tmp`;
  await sharp(sourcePath)
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(tmpPath);
  await fs.promises.rename(tmpPath, destPath);
  return destPath;
};

const run = async () => {
  if (!fs.existsSync(imgDir)) {
    console.error(`Image folder not found: ${imgDir}`);
    process.exit(1);
  }

  await connectDatabase();

  for (const product of hardcodedProducts) {
    const imgKey = product.img;
    if (!imgKey) {
      console.warn(`Skipping entry without img key: ${JSON.stringify(product)}`);
      continue;
    }

    const matchedFile = await findImageFile(imgKey);
    if (!matchedFile) {
      console.error(`No matching image found for img key: ${imgKey}`);
      continue;
    }

    const sourcePath = path.join(imgDir, matchedFile);
    const targetFolder = path.join(outputUploadsDir, 'hardcoded', imgKey);
    const destMain = path.join(targetFolder, `${imgKey}.webp`);
    const destThumb = path.join(targetFolder, `${imgKey}-thumb.webp`);

    try {
      await convertToWebp(sourcePath, destMain, { maxSize: 1200, quality: 85 });
      await convertToWebp(sourcePath, destThumb, { maxSize: 200, quality: 85 });

      const imageUrl = `/uploads/hardcoded/${imgKey}/${imgKey}.webp`;
      const thumbnailUrl = `/uploads/hardcoded/${imgKey}/${imgKey}-thumb.webp`;

      await ProductModel.updateOne(
        { did: product.did },
        { $set: { imageUrl, thumbnailUrl } }
      );

      console.log(`✔ ${product.name}`);
      console.log(`  source: ${sourcePath}`);
      console.log(`  main:   ${destMain}`);
      console.log(`  thumb:  ${destThumb}`);
      console.log(`  updated product.did=${product.did} with new image URLs`);
    } catch (err) {
      console.error(`Failed to convert image for ${product.name}:`, err);
    }
  }
};

run()
  .then(() => closeDatabase())
  .catch((err) => {
    console.error('Script failed:', err);
    closeDatabase().finally(() => process.exit(1));
  });
