async function verify() {
  const resEn = await fetch('https://api.surokkha.store/api/v1/products?limit=100');
  const dataEn = await resEn.json();
  const productsEn = dataEn.data || [];

  const resBn = await fetch('https://api.surokkha.store/api/v1/products?limit=100&lang=bn');
  const dataBn = await resBn.json();
  const productsBn = dataBn.data || [];

  console.log('=== VERIFICATION OF ALL PRODUCTS (EN & BN) ===\n');

  let failedCount = 0;

  for (let i = 0; i < productsEn.length; i++) {
    const pen = productsEn[i];
    const pbn = productsBn[i] || {};

    const isMO =
      (pen.name && pen.name.toUpperCase().startsWith('MO')) ||
      (pen.slug && pen.slug.toLowerCase().startsWith('mo-'));

    if (!isMO) {
      const enRaw = JSON.stringify(pen);
      const bnRaw = JSON.stringify(pbn);
      const hasCondomEn = /condom/i.test(enRaw);
      const hasCondomBn = /condom|কনডম/i.test(bnRaw);

      console.log('Product: [' + pen.did + '] ' + pen.name);
      console.log('  - Slug: ' + pen.slug);
      console.log('  - Category: ' + (pen.category?.name || pen.category));
      console.log('  - Has condom in EN: ' + hasCondomEn);
      console.log('  - Has condom/কনডম in BN: ' + hasCondomBn);

      if (hasCondomEn || hasCondomBn) {
        failedCount++;
        console.log('  -> FAILURE: Found condom in non-MO product!');
      } else {
        console.log('  -> PASS: 100% Clean');
      }
      console.log('');
    }
  }

  console.log('==============================================');
  console.log('Final Verification Result: ' + (failedCount === 0 ? 'ALL CHECKS PASSED (0 issues)' : failedCount + ' issues found'));
}

verify().catch(console.error);
