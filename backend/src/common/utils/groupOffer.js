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

  const products = [
    ...new Set((Array.isArray(body.products) ? body.products : []).map((p) => String(p?.id || p?._id || p)).filter(Boolean)),
  ];
  if (products.length < 2) errors.push("Select at least 2 products");

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

// Per-piece price shown to customers: active offer price, else list price (variant products start at their cheapest variant)
const unitPriceOf = (p) => {
  if (Array.isArray(p.variants) && p.variants.length) {
    return Math.min(...p.variants.map((v) => (Number(v.offerPrice) > 0 ? Number(v.offerPrice) : Number(v.price))));
  }
  return Number(p.offerPrice) > 0 && Number(p.offerPrice) < Number(p.price) ? Number(p.offerPrice) : Number(p.price || 0);
};

const POPULATE_FIELDS = "name did slug thumbnailUrl imageUrl gallery price offerPrice variants stockStatus categories";
export const GROUP_POPULATE = { path: "groupOffer.products", select: POPULATE_FIELDS, populate: { path: "categories", select: "slug" } };

/** Item document (type "group") -> flat Group Offer shape used by the dashboard and storefront. */
export function serializeGroupOffer(item, { publicView = false } = {}) {
  const o = item.toJSON ? item.toJSON() : item;
  const g = o.groupOffer || {};
  const products = (g.products || []).filter((p) => p && typeof p === "object");
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
          id: String(p.id || p._id),
          did: p.did,
          slug: p.slug,
          name: p.name,
          unitPrice: unitPriceOf(p),
          image: p.thumbnailUrl || p.imageUrl || p.gallery?.[0] || "",
          inStock: String(p.stockStatus || "instock").toLowerCase() !== "outofstock",
        }))
      : products.map((p) => ({ id: String(p.id || p._id), name: p.name })),
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
