// Shared Group Offer helpers: payload normalization (dashboard writes) and public serialization (storefront reads)

const DISCOUNT_TYPES = ["percentage", "fixed"];

const toDiscount = (raw) => {
  const discountType = DISCOUNT_TYPES.includes(raw?.discountType) ? raw.discountType : "percentage";
  const discountValue = Math.max(0, Number(raw?.discountValue) || 0);
  return { discountType, discountValue };
};

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Validates a dashboard payload and returns { errors, normalized }. */
export function normalizeGroupOfferPayload(body = {}) {
  const errors = [];
  const name = String(body.name || "").trim();
  if (!name) errors.push("Name is required");

  const slug = slugify(body.slug || name);
  if (!slug) errors.push("Slug is required");

  // Products are typed by hand: { name, unitPrice, imageUrl? }; duplicates by name are dropped
  const seen = new Set();
  const products = [];
  for (const raw of Array.isArray(body.products) ? body.products : []) {
    const productName = String(raw?.name || "").trim();
    if (!productName || seen.has(productName.toLowerCase())) continue;
    seen.add(productName.toLowerCase());
    const unitPrice = Number(raw?.unitPrice);
    if (!(unitPrice > 0)) errors.push(`Enter a price per piece for "${productName}"`);
    let key = slugify(productName) || `product-${products.length + 1}`;
    while (products.some((p) => p.key === key)) key += "-x";
    products.push({ key, name: productName, unitPrice: unitPrice > 0 ? unitPrice : 0, imageUrl: String(raw?.imageUrl || "").trim() });
  }
  if (products.length < 2) errors.push("Add at least 2 products");

  const minOrderAmount = Math.max(0, Number(body.minOrderAmount ?? 250) || 0);
  const minPerProduct = Math.max(1, Math.floor(Number(body.minPerProduct ?? 2) || 2));
  const pricingMode = body.pricingMode === "conditional" ? "conditional" : "fixed";

  const fixedDiscount = toDiscount(body.fixedDiscount);
  const conditions = (Array.isArray(body.conditions) ? body.conditions : [])
    .map((c) => ({ minOrderAmount: Math.max(0, Number(c?.minOrderAmount) || 0), ...toDiscount(c) }))
    .sort((a, b) => a.minOrderAmount - b.minOrderAmount);

  const all = pricingMode === "fixed" ? [fixedDiscount] : conditions;
  if (pricingMode === "conditional" && conditions.length === 0) errors.push("Add at least one condition");
  if (all.some((d) => d.discountType === "percentage" && d.discountValue > 100)) errors.push("Percentage discount cannot exceed 100%");

  return {
    errors,
    normalized: {
      name,
      slug,
      description: String(body.description || "").trim(),
      imageUrl: String(body.imageUrl || "").trim(),
      isActive: body.isActive !== false,
      products,
      minOrderAmount,
      minPerProduct,
      pricingMode,
      fixedDiscount,
      conditions,
    },
  };
}

/** Item document (type "group") -> flat Group Offer shape used by the dashboard and storefront. */
export function serializeGroupOffer(item, { publicView = false } = {}) {
  const o = item.toJSON ? item.toJSON() : item;
  const g = o.groupOffer || {};
  const products = (g.products || []).filter((p) => p && p.key);
  return {
    id: String(o.id || o._id),
    did: o.did,
    name: o.name,
    slug: o.slug,
    description: o.description,
    imageUrl: o.imageUrl,
    isActive: o.isActive,
    minOrderAmount: g.minOrderAmount,
    minPerProduct: g.minPerProduct,
    pricingMode: g.pricingMode,
    fixedDiscount: g.fixedDiscount,
    conditions: g.conditions || [],
    products: publicView
      ? products.map((p) => ({
          id: p.key,
          did: p.key,
          slug: p.key,
          name: p.name,
          unitPrice: p.unitPrice,
          image: p.imageUrl || "",
          inStock: true,
        }))
      : products.map((p) => ({ name: p.name, unitPrice: p.unitPrice, imageUrl: p.imageUrl || "" })),
  };
}

/** Normalized dashboard payload -> Item fields. Group offers never go to the Meta catalog. */
export function toItemFields(n) {
  return {
    name: n.name,
    slug: n.slug,
    description: n.description,
    imageUrl: n.imageUrl,
    isActive: n.isActive,
    type: "group",
    excludeFromMetaCatalog: true,
    stockStatus: "instock",
    groupOffer: {
      products: n.products,
      minOrderAmount: n.minOrderAmount,
      minPerProduct: n.minPerProduct,
      pricingMode: n.pricingMode,
      fixedDiscount: n.fixedDiscount,
      conditions: n.conditions,
    },
  };
}
