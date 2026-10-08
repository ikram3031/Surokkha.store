const fs = require('fs');

// Fix useStore.js
let us = fs.readFileSync('frontend/src/common/store/useStore.js', 'utf8');
us = us.replace(/tagline_bn: taglineBn \|\| '.*',/, 'tagline_bn: taglineBn || englishTagline,');
us = us.replace(/description_bn: descriptionBn \|\| '.*',/, 'description_bn: descriptionBn || englishDescription,');
us = us.replace(/packSize_bn: itemBn\.packSize \|\| p\.packSize \|\| '',/, 'packSize_bn: itemBn.packSize || p.packSize || p.packSize_bn || "",');
fs.writeFileSync('frontend/src/common/store/useStore.js', us, 'utf8');

// Fix productUtils.js
let pu = fs.readFileSync('backend/src/common/utils/productUtils.js', 'utf8');
pu = pu.replace(/const origin = isBn \? \(bnData\.origin \|\| \(source\?\.origin === "China Imported" \? ".*" : source\?\.origin \|\| ".*"\)\) : \(source\?\.origin \|\| "China Imported"\);/, 'const origin = isBn ? (bnData.origin || source?.origin || "") : (source?.origin || "");');
pu = pu.replace(/const expiryDate = isBn \? \(bnData\.expiryDate \|\| ".*"\) : \(source\?\.expiryDate \|\| "2030"\);/, 'const expiryDate = isBn ? (bnData.expiryDate || source?.expiryDate || "") : (source?.expiryDate || "");');
fs.writeFileSync('backend/src/common/utils/productUtils.js', pu, 'utf8');

console.log('Hardcoded strings removed');
