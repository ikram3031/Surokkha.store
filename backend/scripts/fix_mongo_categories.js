const CAT_CONTRACEPTIVE = new ObjectId('6ab81620a561a97a08a0de92');
const CAT_COMBO = new ObjectId('6ab81620a561a97a08a0de93');
const CAT_LUBRICANTS = new ObjectId('6ac06c4a48d37618fae36c3a');
const ADMIN_ID = new ObjectId('6ab2c988721c81cc891e69d2');

const lubricantSlugs = [
  'eazy-gelly-50gm',
  'ky-jelly-personal-lubricant-gel-50g',
  'tonohime-peach-flavoured-lube-gel-100ml',
  'tonohime-blueberry-flavored-lube-gel-100ml',
  'tonohime-grape-flavoured-lube-gel-100ml'
];

const comboSlugs = [
  'mo-micro-thin-latex-contraceptive-20-pcs-combo',
  'mo-micro-ribbed-natural-latex-contraceptive-20-pcs-combo',
  'mo-multi-textured-latex-contraceptive-20-pcs-combo',
  'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'
];

const products = db.products.find({}).toArray();

for (const p of products) {
  let catId = CAT_CONTRACEPTIVE;
  if (lubricantSlugs.includes(p.slug)) {
    catId = CAT_LUBRICANTS;
  } else if (comboSlugs.includes(p.slug)) {
    catId = CAT_COMBO;
  }

  const update = {
    $set: {
      categories: [catId],
      createdBy: ADMIN_ID,
      updatedBy: ADMIN_ID,
      updatedAt: new Date()
    },
    $unset: {}
  };

  // Remove category field if it's corrupted or set properly
  if (p.category) {
    update.$set.category = catId;
  }

  db.products.updateOne({ _id: p._id }, update);
  console.log('Fixed categories for product:', p.name, '-> Category:', catId.toString());
}

console.log('Categories repair complete!');
