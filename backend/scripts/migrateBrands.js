import { connectDatabase, closeDatabase } from '../src/common/database/index.js';
import { BrandModel } from '../src/common/models/brand.model.js';
import { ProductModel } from '../src/common/models/product.model.js';

const MASTER_BRANDS = {
  niche: {
    name: "Niche",
    did: "6753bac703aeecba",
    _id: "6a64c1ee19f66260bb34f468",
    items: [
      "Amouage", "Argos", "Atelier des Ors", "BDK Parfums", "Boadicea", "Byredo",
      "Clive Christian", "Creed", "Diptyque", "Essential Parfums", "Ex Nihilo",
      "Fragrance Du Bois", "Frederic Malle", "Giardini di Toscana", "Gisada",
      "Goldfield & Banks", "Initio Parfums Privés", "Kajal", "Kayali", "Kilian",
      "Le Labo", "Maison Crivelli", "Maison Francis Kurkdjian", "Maison Margiela",
      "Mancera", "Marc-Antoine Barrois", "Matiere Premiere", "Memo Paris",
      "Montale", "Nishane", "Oman Luxury", "Ormonde Jayne", "Orto Parisi",
      "Parfums de Marly", "Penhaligon's", "Profumum Roma", "Roja Parfums",
      "Serge Lutens", "Sospiro", "Stéphane Humbert Lucas 777", "Superz.",
      "Unique'e Luxury", "Van Cleef & Arpels", "Xerjoff", "Rosendo Mateu"
    ]
  },
  designer: {
    name: "Designer Brands",
    did: "202873cd38f8974b",
    _id: "6a64c1ee19f66260bb34f469",
    items: [
      "Azzaro", "Bentley", "Billie Eilish", "Bottega Veneta", "Burberry", "Bvlgari",
      "Calvin Klein", "Carolina Herrera", "Cartier", "Chanel", "Chloé", "Coach",
      "Davidoff", "Diesel", "Dior", "Dolce & Gabbana", "Dunhill", "Elie Saab",
      "Elizabeth Arden", "Giorgio Armani", "Givenchy", "Gucci", "Guerlain", "Hermès",
      "Hugo Boss", "Issey Miyake", "Jean Paul Gaultier", "Jimmy Choo", "Jo Malone London",
      "Juicy Couture", "Kenzo", "Lacoste", "Lancôme", "Louis Vuitton", "Marc Jacobs",
      "Mercedes-Benz", "Missoni", "Montblanc", "Moschino", "Mugler", "Narciso Rodriguez",
      "Nautica", "Prada", "Rabanne", "Ralph Lauren", "Sabrina Carpenter", "Tommy Hilfiger",
      "Tom Ford", "Valentino", "Versace", "Victoria's Secret", "Viktor & Rolf",
      "Yves Saint Laurent", "Zara", "Ariana Grande", "Fragrance One", "Lalique",
      "Dumont"
    ]
  },
  arabian: {
    name: "UAE & Arabian Brands",
    did: "7dbba3cd8de67be4",
    _id: "6a64c1ee19f66260bb34f46a",
    items: [
      "Afnan", "Ahmad Al Maghribi", "Ajmal", "Al Haramain", "Al Wataniah",
      "Arabian Prestige", "Armaf", "Atralia", "Brandy", "French Avenue",
      "Gissah", "Gulf Orchid", "Ibrahim Al Qurashi", "Khadlaj", "Lattafa",
      "Maison Alhambra", "Maison Asrar", "Naseem", "Nusuk", "Paris Corner",
      "Rasasi", "Rayhaan", "Riiffs", "Swiss Arabian", "Maison Milan"
    ]
  }
};

const duplicateMappings = {
  // Legacy / Typo -> Canonical Master Name
  "roja": "Roja Parfums",
  "maison martin margiela": "Maison Margiela",
  "office for men (fragrance only)": "Fragrance One",
  "bvlgaris": "Bvlgari",
  "chloe": "Chloé",
  "giardini di toscana": "Giardini di Toscana",
  "hermes": "Hermès",
  "jean paul gaultier (jpg)": "Jean Paul Gaultier",
  "paco rabanne": "Rabanne",
  "dolce & gabbana (d&g)": "Dolce & Gabbana",
  "yves saint laurent (ysl)": "Yves Saint Laurent",
  "louis vuitton (lv)": "Louis Vuitton",
  "maison francis kurkdjian (mfk)": "Maison Francis Kurkdjian",
  "parfums de marly (pdm)": "Parfums de Marly",
  "automated duplicate name test": "Test",
  "marc-antoine barrois (mab)": "Marc-Antoine Barrois",
  "stéphane humbert lucas 777": "Stéphane Humbert Lucas 777",
  "maison milan / rosendo mateu": "Rosendo Mateu",
  "maison milan": "Maison Milan"
};

const toSlug = (str) => String(str).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

const run = async () => {
  await connectDatabase();
  console.log("Connected to database. Starting Brand Migration...");

  // Step 1: Ensure parent groups are loaded / created with fixed IDs and DIDs
  const parentIds = {};
  const parentDids = {};

  for (const [key, category] of Object.entries(MASTER_BRANDS)) {
    let parentDoc = await BrandModel.findById(category._id);
    if (!parentDoc) {
      parentDoc = await BrandModel.findOne({ did: category.did });
    }
    
    if (parentDoc) {
      parentDoc.name = category.name;
      parentDoc.slug = toSlug(category.name);
      parentDoc.parent = null;
      await parentDoc.save();
    } else {
      parentDoc = await BrandModel.create({
        _id: category._id,
        name: category.name,
        slug: toSlug(category.name),
        did: category.did,
        parent: null
      });
    }
    parentIds[key] = parentDoc._id;
    parentDids[key] = parentDoc.did;
    console.log(`Parent Category verified: "${category.name}" (${parentDoc.did})`);
  }

  // Fetch all existing brands in DB for comparison
  const allExistingBrands = await BrandModel.find({ parent: { $ne: null } });

  // Helper to map dynamic fields case-insensitively
  const getBrandMatch = (name) => {
    const cleanName = name.toLowerCase().trim();
    // Check duplication mapping first
    const mappedName = duplicateMappings[cleanName] || name;
    
    return allExistingBrands.find(b => 
      b.name.toLowerCase().trim() === mappedName.toLowerCase().trim() ||
      b.slug === toSlug(mappedName)
    );
  };

  // Step 2: Clean up duplicates and align mappings (Executed BEFORE remapping products)
  console.log("Aligning dynamic duplicate mapping pointers...");
  const childBrandMapping = {}; // mapping from old/duplicate DID to canonical master brand doc

  // Seed / Upsert the 128 canonical brands
  for (const [catKey, category] of Object.entries(MASTER_BRANDS)) {
    const parentId = parentIds[catKey];
    
    for (const itemName of category.items) {
      const canonicalSlug = toSlug(itemName);
      let brandDoc = getBrandMatch(itemName);

      if (brandDoc) {
        // Brand exists. Ensure it points to correct parent group ID
        brandDoc.parent = parentId;
        brandDoc.name = itemName;
        brandDoc.slug = canonicalSlug;
        await brandDoc.save();
        childBrandMapping[brandDoc.did] = brandDoc;
      } else {
        // Create new brand
        brandDoc = await BrandModel.create({
          name: itemName,
          slug: canonicalSlug,
          parent: parentId
        });
        childBrandMapping[brandDoc.did] = brandDoc;
        console.log(`Created missing brand: "${itemName}" under ${category.name}`);
      }
    }
  }

  // Map duplicate or legacy entity DIDs to their canonical master brand mapping
  for (const b of allExistingBrands) {
    const cleanName = b.name.toLowerCase().trim();
    const mappedTargetName = duplicateMappings[cleanName];
    if (mappedTargetName) {
      // Find the canonical master brand document we just updated/created
      const canonicalDoc = getBrandMatch(mappedTargetName);
      if (canonicalDoc && canonicalDoc.did !== b.did) {
        childBrandMapping[b.did] = canonicalDoc;
        console.log(`Redirecting legacy brand entity "${b.name}" (${b.did}) -> "${canonicalDoc.name}" (${canonicalDoc.did})`);
      }
    }
  }

  // Step 3: Map & Re-assign Existing Products
  console.log("Updating product brand references...");
  const products = await ProductModel.find({});
  let productsUpdatedCount = 0;

  for (const product of products) {
    if (!product.brand || product.brand.length === 0) continue;

    const newBrandDids = new Set();

    for (const item of product.brand) {
      // Check if it is a parent category DID
      const isParentDid = Object.values(parentDids).includes(item);
      if (isParentDid) {
        newBrandDids.add(item);
        continue;
      }

      // Check child brand mapping
      const canonicalBrand = childBrandMapping[item];
      if (canonicalBrand) {
        newBrandDids.add(canonicalBrand.did);
        // Also ensure its parent category did is present in the list
        const parentCategoryDoc = Object.entries(parentIds).find(([_, id]) => id.toString() === canonicalBrand.parent?.toString());
        if (parentCategoryDoc) {
          newBrandDids.add(parentDids[parentCategoryDoc[0]]);
        }
      } else {
        // Keep fallback if it is a string representation or custom DID
        newBrandDids.add(item);
      }
    }

    product.brand = Array.from(newBrandDids);
    await product.save();
    productsUpdatedCount++;
  }

  console.log(`✔ Finished remapping product links on ${productsUpdatedCount} products.`);

  // Step 4: Delete legacy duplicate brands that are no longer canonical
  console.log("Cleaning up legacy database duplicate entries...");
  const canonicalDids = new Set(Object.values(childBrandMapping).map(b => b.did));
  
  // Also keep parent DIDs
  Object.values(parentDids).forEach(did => canonicalDids.add(did));

  const deleteResult = await BrandModel.deleteMany({
    parent: { $ne: null },
    did: { $nin: Array.from(canonicalDids) }
  });
  console.log(`✔ Deleted ${deleteResult.deletedCount} legacy duplicate brand entries.`);

  console.log("Migration finished successfully!");
};

run()
  .then(() => closeDatabase())
  .catch(err => {
    console.error("Migration failed:", err);
    closeDatabase().finally(() => process.exit(1));
  });
