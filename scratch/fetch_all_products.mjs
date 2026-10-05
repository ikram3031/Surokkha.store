async function main() {
  const res = await fetch('https://api.surokkha.store/api/v1/products?limit=100');
  const data = await res.json();
  const products = data.data || [];
  console.log(`TOTAL PRODUCTS: ${products.length}\n`);
  for (const p of products) {
    console.log(JSON.stringify({
      did: p.did,
      brand: p.brand,
      slug: p.slug,
      name: p.name,
      title: p.title,
      name_bn: p.name_bn || p.data_bn?.name,
      category: p.category?.name || p.category,
      tagline: p.tagline,
      tagline_bn: p.data_bn?.tagline,
      description: p.description?.slice(0, 80),
      description_bn: p.data_bn?.description?.slice(0, 80),
    }, null, 2));
  }
}

main().catch(console.error);
