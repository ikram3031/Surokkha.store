const fs = require('fs');
let t = fs.readFileSync('frontend/src/common/store/useStore.js', 'utf8');

const s1 = t.indexOf('if (catNameLower.includes(\'contraceptive\')');
const e1 = t.indexOf('const rawBrand =', s1);
if(s1 > -1 && e1 > -1) {
    t = t.substring(0, s1) + t.substring(e1);
}

fs.writeFileSync('frontend/src/common/store/useStore.js', t, 'utf8');
