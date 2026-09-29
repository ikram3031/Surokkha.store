async function checkSlugs() {
  const res = await fetch("https://api.surokkha.store/api/v1/products?limit=50");
  const json = await res.json();
  console.log("=== VERIFIED PRODUCT LIST WITH UPDATED SLUGS ===");
  json.data.forEach((p, i) => {
    console.log(`[${i + 1}] Name: "${p.name}"  ==>  Slug: "${p.slug}"  (SKU: ${p.sku})`);
  });
}
checkSlugs().catch(console.error);
