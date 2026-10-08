const fs = require('fs');
let text = fs.readFileSync('backend/src/common/utils/productUtils.js', 'utf8');

const replacement1 = 
    const populatedCategories = rawCategories
      .filter((c) => c && typeof c === "object" && (c.name || c.slug || c.did || c._id))
      .map((c) => {
        const catName = c.name ?? "";
        let localizedCatName = c.name_bn || catName;

        return {
          id: c._id?.toString?.() ?? c.id ?? null,
          _id: c._id?.toString?.() ?? c.id ?? null,
          did: c.did ?? null,
          name: lang === "bn" ? localizedCatName : catName,
          name_bn: c.name_bn || localizedCatName,
          slug: c.slug ?? "",
          imageUrl: c.imageUrl ?? "",
          parent: c.parent ?? null,
        };
      });
;

text = text.replace(/const populatedCategories = rawCategories[\s\S]*?parent: c\.parent \?\? null,\n        \};\n      \}\);/m, replacement1.trim());

const replacement2 = 
    let primaryCategory = populatedCategories.length > 0 ? populatedCategories[0] : null;
    if (!primaryCategory && source?.category) {
      if (typeof source.category === "object") {
        primaryCategory = source.category;
      } else if (typeof source.category === "string") {
        const catName = source.category;
        let localizedCatName = catName;

        primaryCategory = {
          name: catName,
          name_bn: localizedCatName,
          slug: catName.toLowerCase().replace(/\\s+/g, "-"),
        };
      }
    }
;

text = text.replace(/let primaryCategory = populatedCategories\.length > 0 \? populatedCategories\[0\] \: null;[\s\S]*?slug: catName\.toLowerCase\(\)\.replace\(\/\\s\+\/g, "-"\),\n        \};\n      \}\n    \}/m, replacement2.trim());

fs.writeFileSync('backend/src/common/utils/productUtils.js', text, 'utf8');
