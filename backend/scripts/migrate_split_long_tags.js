import { connectDatabase, closeDatabase } from "../src/common/database/index.js";
import { ProductModel } from "../src/common/models/product.model.js";

/**
 * Normalizes and splits combined tag strings (hyphenated or space-delimited)
 * into a clean array of individual tags stored in standard MongoDB schema format.
 *
 * @param {Array<string>} tags - Existing raw tags array
 * @returns {Array<string>} Clean, deduplicated, lowercased array of tag strings
 */
export const normalizeTags = (tags) => {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  const resultSet = new Set();

  tags.forEach((rawTag) => {
    if (typeof rawTag !== "string") return;
    const cleanStr = rawTag.trim();
    if (!cleanStr) return;

    // Split by hyphens, commas, underscores, and whitespace
    const words = cleanStr
      .split(/[\s,\-_]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);

    words.forEach((w) => resultSet.add(w));
  });

  return Array.from(resultSet);
};

async function runTagMigration() {
  console.log("=================================================");
  console.log("  Starting Product Tags Normalization Migration  ");
  console.log("=================================================\n");

  await connectDatabase();

  const products = await ProductModel.find({}).lean();
  console.log(`Found ${products.length} total products in database.\n`);

  let updatedCount = 0;
  const sampleOutputs = {
    hyphenatedSample: null,
    spaceSample: null,
  };

  for (const product of products) {
    const originalTags = Array.isArray(product.tags) ? product.tags : [];
    if (originalTags.length === 0) continue;

    // Check if any tag needs splitting (contains hyphens, spaces, commas or is longer than 25 chars)
    const hasComplexTags = originalTags.some(
      (t) =>
        typeof t === "string" &&
        (t.includes("-") || t.includes(" ") || t.includes(",") || t.length > 25)
    );

    if (!hasComplexTags) continue;

    const cleanedTags = normalizeTags(originalTags);

    await ProductModel.updateOne(
      { _id: product._id },
      { $set: { tags: cleanedTags } }
    );

    updatedCount++;

    // Capture sample 1: from 36 hyphenated products (e.g. Bacchus / Argos)
    if (
      !sampleOutputs.hyphenatedSample &&
      originalTags.some((t) => t.includes("bacchus") || t.includes("triumph") || t.includes("valaya") || t.includes("torino"))
    ) {
      sampleOutputs.hyphenatedSample = {
        name: product.name,
        before: originalTags,
        after: cleanedTags,
      };
    }

    // Capture sample 2: from 15 clone / space-separated products (e.g. clone / vibe)
    if (
      !sampleOutputs.spaceSample &&
      originalTags.some((t) => t.includes("clone") || t.includes("vibe") || t.includes("alternative"))
    ) {
      sampleOutputs.spaceSample = {
        name: product.name,
        before: originalTags,
        after: cleanedTags,
      };
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} products.\n`);

  if (sampleOutputs.hyphenatedSample) {
    console.log("-------------------------------------------------");
    console.log(`Sample 1 (Hyphenated SEO string group): "${sampleOutputs.hyphenatedSample.name}"`);
    console.log("BEFORE Tags:", sampleOutputs.hyphenatedSample.before);
    console.log("AFTER Tags:", sampleOutputs.hyphenatedSample.after);
  }

  if (sampleOutputs.spaceSample) {
    console.log("-------------------------------------------------");
    console.log(`Sample 2 (Space-delimited Clone notes group): "${sampleOutputs.spaceSample.name}"`);
    console.log("BEFORE Tags:", sampleOutputs.spaceSample.before);
    console.log("AFTER Tags:", sampleOutputs.spaceSample.after);
  }

  console.log("-------------------------------------------------\n");

  await closeDatabase();
}

// Allow direct execution or module import
if (process.argv[1]?.endsWith("migrate_split_long_tags.js")) {
  runTagMigration()
    .then(() => {
      console.log("Migration finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration error:", err);
      process.exit(1);
    });
}
