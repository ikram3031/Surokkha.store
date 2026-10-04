function sanitizeEnglishText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
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

function sanitizeBengaliText(text) {
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

function sanitizeData(data, isBn) {
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

const products = db.products.find({}).toArray();
console.log('Total products in MongoDB:', products.length);

let updated = 0;
for (const product of products) {
  const isMO =
    (product.name && product.name.toUpperCase().startsWith('MO')) ||
    (product.slug && product.slug.toLowerCase().startsWith('mo-')) ||
    (product.brand && Array.isArray(product.brand) && product.brand.includes('MO')) ||
    (typeof product.brand === 'string' && product.brand.toUpperCase() === 'MO');

  if (isMO) {
    console.log('[MO Product - Skipped]:', product.name);
    continue;
  }

  const origJson = JSON.stringify(product);
  const hasCondom = /condom|কনডম/i.test(origJson);

  let updatedSlug = product.slug;
  if (updatedSlug && /condom/i.test(updatedSlug)) {
    updatedSlug = updatedSlug
      .replace(/-?condoms?/gi, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const cleaned = sanitizeData(product, false);
  cleaned.slug = updatedSlug;

  if (cleaned.name) cleaned.name = sanitizeEnglishText(cleaned.name);
  if (cleaned.title) cleaned.title = sanitizeEnglishText(cleaned.title);
  if (cleaned.tagline) cleaned.tagline = sanitizeEnglishText(cleaned.tagline);
  if (cleaned.description) cleaned.description = sanitizeEnglishText(cleaned.description);
  if (cleaned.longDescription) cleaned.longDescription = sanitizeEnglishText(cleaned.longDescription);
  if (cleaned.packageContents) cleaned.packageContents = sanitizeEnglishText(cleaned.packageContents);

  if (cleaned.bn) {
    cleaned.bn = sanitizeData(cleaned.bn, true);
  }

  const cleanedJson = JSON.stringify(cleaned);
  if (origJson !== cleanedJson || hasCondom) {
    console.log('[UPDATING] Non-MO Product:', product.name, '(DID:', product.did, ')');
    const { _id, ...fields } = cleaned;
    fields.updatedAt = new Date();
    db.products.updateOne({ _id: product._id }, { $set: fields });
    updated++;
  } else {
    console.log('[CLEAN] Non-MO Product:', product.name);
  }
}

console.log('Finished! Total non-MO products updated in MongoDB:', updated);
