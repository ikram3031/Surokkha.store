import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'surokkha-db';

/**
 * Text sanitization for English content
 */
export function sanitizeEnglishText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    // Replace phrases first
    .replace(/\bTotal (\d+) Condoms\b/gi, 'Total $1 Contraceptives')
    .replace(/\b(\d+) Condoms\b/gi, '$1 Contraceptives')
    .replace(/\bplain condoms\b/gi, 'standard contraceptives')
    .replace(/\bpleasure condoms\b/gi, 'textured contraceptives')
    .replace(/\bcondoms\b/gi, 'contraceptives')
    .replace(/\bcondom\b/gi, 'contraceptive')
    .replace(/\bCondoms\b/g, 'Contraceptives')
    .replace(/\bCondom\b/g, 'Contraceptive')
    .replace(/Condom Compatibility/g, 'Latex Compatibility');
}

/**
 * Text sanitization for Bengali content
 */
export function sanitizeBengaliText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/কনডম ফ্রেন্ডলি/g, 'ল্যাটেক্স ফ্রেন্ডলি')
    .replace(/কনডম উপযোগিতা/g, 'ল্যাটেক্স উপযোগিতা')
    .replace(/কনডমের কোনো ক্ষতি করে না/g, 'ল্যাটেক্স সামগ্রীর কোনো ক্ষতি করে না')
    .replace(/কনডমের/g, 'ল্যাটেক্স সুরক্ষার')
    .replace(/কনডমে/g, 'ল্যাটেক্স সুরক্ষায়')
    .replace(/কনডমগুলো/g, 'কন্ট্রাসেপ্টিভগুলো')
    .replace(/কনডম/g, 'কন্ট্রাসেপ্টিভ');
}

/**
 * Recursively cleans an object or array, stripping 'condom'/'কনডম' from strings and keys
 */
export function sanitizeData(data, isBn = false) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return isBn ? sanitizeBengaliText(data) : sanitizeEnglishText(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, isBn));
  }

  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      const fieldIsBn = isBn || key === 'bn' || key.endsWith('_bn') || /[\u0980-\u09FF]/.test(key);
      const cleanKey = fieldIsBn ? sanitizeBengaliText(key) : sanitizeEnglishText(key);
      cleaned[cleanKey] = sanitizeData(value, fieldIsBn);
    }
    return cleaned;
  }

  return data;
}

export async function runSanitization({ dryRun = false } = {}) {
  console.log(`Connecting to MongoDB at ${MONGODB_URI} (${MONGODB_DB_NAME})...`);
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB_NAME);
  const collection = db.collection('products');

  const products = await collection.find({}).toArray();
  console.log(`Found ${products.length} total products in database.\n`);

  let modifiedCount = 0;

  for (const product of products) {
    const isMO =
      (product.name && product.name.toUpperCase().startsWith('MO')) ||
      (product.slug && product.slug.toLowerCase().startsWith('mo-')) ||
      (product.brand && Array.isArray(product.brand) && product.brand.includes('MO')) ||
      (typeof product.brand === 'string' && product.brand.toUpperCase() === 'MO');

    if (isMO) {
      console.log(`[SKIPPED] MO Product: "${product.name}" (${product.slug})`);
      continue;
    }

    console.log(`\n========================================================`);
    console.log(`[PROCESSING] Non-MO Product: "${product.name}" (DID: ${product.did}, Slug: ${product.slug})`);

    const originalJson = JSON.stringify(product);
    const hasCondom = /condom|কনডম/i.test(originalJson);

    // Sanitize fields
    let updatedSlug = product.slug;
    if (updatedSlug && /condom/i.test(updatedSlug)) {
      updatedSlug = updatedSlug
        .replace(/-?condoms?/gi, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      console.log(`  -> New Slug: ${updatedSlug}`);
    }

    const cleanedData = sanitizeData(product);
    cleanedData.slug = updatedSlug;

    // Specific field sanitizations
    if (cleanedData.name) cleanedData.name = sanitizeEnglishText(cleanedData.name);
    if (cleanedData.title) cleanedData.title = sanitizeEnglishText(cleanedData.title);
    if (cleanedData.tagline) cleanedData.tagline = sanitizeEnglishText(cleanedData.tagline);
    if (cleanedData.description) cleanedData.description = sanitizeEnglishText(cleanedData.description);
    if (cleanedData.longDescription) cleanedData.longDescription = sanitizeEnglishText(cleanedData.longDescription);
    if (cleanedData.packageContents) cleanedData.packageContents = sanitizeEnglishText(cleanedData.packageContents);

    if (cleanedData.bn) {
      cleanedData.bn = sanitizeData(cleanedData.bn, true);
    }

    const cleanedJson = JSON.stringify(cleanedData);

    if (originalJson !== cleanedJson || hasCondom) {
      console.log(`  -> Changes detected for "${product.name}"`);
      modifiedCount++;

      if (!dryRun) {
        const { _id, ...updatePayload } = cleanedData;
        updatePayload.updatedAt = new Date();
        await collection.updateOne({ _id: product._id }, { $set: updatePayload });
        console.log(`  -> [UPDATED] Saved changes to database for DID: ${product.did}`);
      } else {
        console.log(`  -> [DRY RUN] Would update product DID: ${product.did}`);
      }
    } else {
      console.log(`  -> Product is already clean.`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`Completed. Total products updated: ${modifiedCount} (Dry Run: ${dryRun})`);

  await client.close();
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('sanitize_non_mo_products.js')) {
  const isDryRun = process.argv.includes('--dry-run');
  runSanitization({ dryRun: isDryRun }).catch((err) => {
    console.error('Error during sanitization:', err);
    process.exit(1);
  });
}
