import fs from 'fs';

const COMMON_CORRECTIONS = {
  'দোকখিন': 'দক্ষিণ',
  'দকখিন': 'দক্ষিণ',
  'উত্তোর': 'উত্তর',
  'উত্তোর': 'উত্তর',
  'পওরোসোভা': 'পৌরসভা',
  'পৌরসোভা': 'পৌরসভা',
  'পোউরোসভা': 'পৌরসভা',
  'সোশিবুশন': 'শশীভূষণ',
  'সোশীবুশন': 'শশীভূষণ',
  'গৌরনোদি': 'গৌরনদী',
  'মুলাদি': 'মুলাদী',
  'চর ফ্যাশন': 'চরফ্যাশন',
};

async function translateBatch(batch) {
  const text = batch.join('\n');
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=' + encodeURIComponent(text);
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      
      let fullTranslated = '';
      if (Array.isArray(data[0])) {
        fullTranslated = data[0].map(x => x[0]).join('');
      }
      
      const lines = fullTranslated.split('\n').map(s => s.trim());
      if (lines.length === batch.length) {
        return lines;
      }
      // If newline split count mismatch, fallback item-by-item
      if (attempt === 3) {
        return await translateItemByItem(batch);
      }
    } catch (e) {
      if (attempt === 3) {
        return await translateItemByItem(batch);
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function translateItemByItem(batch) {
  const results = [];
  for (const item of batch) {
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=' + encodeURIComponent(item);
      const res = await fetch(url);
      const data = await res.json();
      const tr = data[0]?.[0]?.[0]?.trim() || item;
      results.push(tr);
    } catch {
      results.push(item);
    }
    await new Promise(r => setTimeout(r, 80));
  }
  return results;
}

function cleanBn(str) {
  if (!str) return '';
  let res = str;
  for (const [k, v] of Object.entries(COMMON_CORRECTIONS)) {
    res = res.replaceAll(k, v);
  }
  return res.trim();
}

async function run() {
  const districtsPath = 'districts.json';
  const districtsDoc = JSON.parse(fs.readFileSync(districtsPath, 'utf8'));

  // Collect unique thana names
  const uniqueNames = new Set();
  for (const dist of districtsDoc.data) {
    for (const t of dist.thanas || []) {
      if (t.name) uniqueNames.add(t.name.trim());
    }
  }

  const nameList = Array.from(uniqueNames);
  console.log(`Starting translation for ${nameList.length} unique thana/zone names...`);

  const BATCH_SIZE = 35;
  const translationMap = {};

  for (let i = 0; i < nameList.length; i += BATCH_SIZE) {
    const chunk = nameList.slice(i, i + BATCH_SIZE);
    const translated = await translateBatch(chunk);

    chunk.forEach((name, idx) => {
      translationMap[name] = cleanBn(translated[idx] || name);
    });

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, nameList.length)} / ${nameList.length} translated`);
    await new Promise(r => setTimeout(r, 250));
  }

  // Save translation mapping
  fs.writeFileSync('thana_bn_map.json', JSON.stringify(translationMap, null, 2), 'utf8');
  console.log('Saved thana_bn_map.json');

  // Apply to districts.json
  let totalUpdated = 0;
  for (const dist of districtsDoc.data) {
    for (const t of dist.thanas || []) {
      const bn = translationMap[t.name.trim()];
      if (bn) {
        t.bnName = bn;
        totalUpdated++;
      }
    }
  }

  fs.writeFileSync(districtsPath, JSON.stringify(districtsDoc, null, 2), 'utf8');
  console.log(`Updated ${totalUpdated} thanas in districts.json with bnName!`);
}

run().catch(console.error);
