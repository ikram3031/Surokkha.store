const fs = require('fs');
let us = fs.readFileSync('frontend/src/common/store/useStore.js', 'utf8');

// Remove category overrides completely!
us = us.replace(/let resolvedCategory = rawCatName;[\s\S]*?const rawBrand =/m, 'let resolvedCategory = rawCatName || "Uncategorized";\n          let resolvedCategorySlug = rawCatSlug || "uncategorized";\n          let resolvedCategoryBn = rawCatBn || resolvedCategory;\n\n          const rawBrand =');

// Remove hardcoded features completely!
us = us.replace(/const features = benefits\.length > 0[\s\S]*?\: \(Array\.isArray\(p\.features\) && p\.features\.length > 0 \? p\.features \: \['Certified safety standard', 'Neutral pH lubrication', 'Tested durability'\]\);/m, 'const features = benefits.length > 0 ? benefits.map((b) => b.title).filter(Boolean) : (Array.isArray(p.features) ? p.features : []);');
us = us.replace(/const featuresBn = benefitsBn\.length > 0[\s\S]*?\: \(Array\.isArray\(itemBn\.features\) && itemBn\.features\.length > 0[\s\S]*?\? itemBn\.features[\s\S]*?\: \(Array\.isArray\(p\.features_bn\) && p\.features_bn\.length > 0 \? p\.features_bn \: features\)\);/m, 'const featuresBn = benefitsBn.length > 0 ? benefitsBn.map((b) => b.title).filter(Boolean) : (Array.isArray(itemBn.features) && itemBn.features.length > 0 ? itemBn.features : (Array.isArray(p.features_bn) && p.features_bn.length > 0 ? p.features_bn : features));');

fs.writeFileSync('frontend/src/common/store/useStore.js', us, 'utf8');

let pu = fs.readFileSync('backend/src/common/utils/productUtils.js', 'utf8');
pu = pu.replace(/if \(lower === "condom" \|\| lower === "condoms" \|\| lower === "contraceptive" \|\| lower === "contraceptives"\) \{[\s\S]*?\} else \{/m, '{');
// Wait, the backend category replacement logic is a bit complex. Let's just strip the if-else block.
