import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function getImagesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getImagesRecursively(fullPath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function convertImageToWebp(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const outputPath = path.join(dir, `${baseName}.webp`);

  console.log(`\nProcessing: ${path.relative(uploadsDir, filePath)}`);

  // Load metadata to see dimensions
  const metadata = await sharp(filePath).metadata();
  console.log(`Original dimensions: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  let pipeline = sharp(filePath);
  if (metadata.width > 2000 || metadata.height > 2000) {
    pipeline = pipeline.resize(2000, 2000, { fit: 'inside', withoutEnlargement: true });
  }

  // Optimize quality for webp
  let quality = 85;
  let buffer = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer();
  let sizeKB = buffer.length / 1024;

  // Fine tune size if larger than 350KB
  for (let attempt = 0; attempt < 5; attempt++) {
    if (sizeKB > 350 && quality > 60) {
      quality -= 5;
      buffer = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer();
      sizeKB = buffer.length / 1024;
    } else {
      break;
    }
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated: ${path.relative(uploadsDir, outputPath)} (${sizeKB.toFixed(2)} KB, quality ${quality})`);
}

async function run() {
  console.log(`Scanning directory: ${uploadsDir}`);
  const images = getImagesRecursively(uploadsDir);

  if (images.length === 0) {
    console.log('No PNG/JPG/JPEG images found to convert in backend/uploads.');
    return;
  }

  console.log(`Found ${images.length} image(s) to convert.`);
  for (const img of images) {
    try {
      await convertImageToWebp(img);
    } catch (err) {
      console.error(`Failed to convert ${img}:`, err);
    }
  }
  console.log('\nAll image conversions finished!');
}

run();

