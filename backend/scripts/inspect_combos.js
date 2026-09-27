async function inspectCombos() {
  const res = await fetch("https://api.surokkha.store/api/v1/products?limit=50");
  const json = await res.json();
  json.data.slice(0, 3).forEach((p, i) => {
    console.log(`\n=================== COMBO ${i + 1}: ${p.name} (${p.slug}) ===================`);
    console.log("ID:", p.id || p._id);
    console.log("Price:", p.price, "OfferPrice:", p.offerPrice);
    console.log("Category:", p.category?.name, p.category?.slug);
    console.log("Specifications:", JSON.stringify(p.specifications, null, 2));
    console.log("Benefits:", JSON.stringify(p.benefits, null, 2));
    console.log("Sections:", JSON.stringify(p.sections, null, 2));
    console.log("BN:", JSON.stringify(p.bn, null, 2));
  });
}
inspectCombos().catch(console.error);
