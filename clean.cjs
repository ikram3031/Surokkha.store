const fs = require('fs');
let t = fs.readFileSync('backend/src/common/utils/productUtils.js', 'utf8');

const s1 = t.indexOf('if (lower === "condom"');
const e1 = t.indexOf('return {', s1);
if(s1 > -1 && e1 > -1) {
    t = t.substring(0, s1) + t.substring(e1);
}

const s2 = t.indexOf('if (lower.includes("lubricant")) localizedCatName');
const e2 = t.indexOf('primaryCategory = {', s2);
if (s2 > -1 && e2 > -1) {
    t = t.substring(0, s2) + t.substring(e2);
}

fs.writeFileSync('backend/src/common/utils/productUtils.js', t, 'utf8');
