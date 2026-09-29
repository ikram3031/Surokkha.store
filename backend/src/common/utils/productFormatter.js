/**
 * Normalizes image URL to use the configured domain
 */
export const normalizeImageUrl = (url) => {
  if (!url) {
    return null;
  }
  return url.replace(/^https?:\/\/[^/]+/i, "https://webiste.decantrebd.com");
};

/**
 * Extracts size (ml) from product slug
 */
export const extractSizeFromSlug = (slug) => {
  if (!slug) {
    return null;
  }
  const match = slug.match(/([0-9]+(?:\.[0-9]+)?)(ml|mls|mL|mLs)/i);
  return match ? `${match[1]}${match[2].toLowerCase()}` : null;
};

/**
 * Formats product row into API response object
 */
export const formatProduct = (row) => {
  const isVariable = Array.isArray(row.variations) && row.variations.length > 0;

  return {
    id: row.ID,
    slug: row.post_name,
    title: row.post_title,
    excerpt: row.post_excerpt,
    status: row.post_status,
    date: row.post_date,
    type: row.post_type,
    product_type: isVariable ? "variable" : "simple",
    image: normalizeImageUrl(row.image_url || null),
    price: isVariable ? null : (row.price ?? null),
    categories: row.categories || [],
    brands: row.brands || [],
    badge: row.badge || null,
    variations: (row.variations || []).map((variation) => ({
      id: variation.ID,
      name: variation.post_title || variation.post_name,
      size: extractSizeFromSlug(variation.post_name || variation.post_title),
      price: variation.price ?? null,
      stock_status: variation.stock_status ?? null,
    })),
  };
};

/**
 * Returns SQL ORDER BY clause based on sort parameters
 */
export const getSortClause = (sortBy, sortOrder) => {
  const order = sortOrder === "asc" ? "ASC" : "DESC";

  switch (sortBy) {
    case "price_asc":
      return `COALESCE(price_meta.meta_value, '0') + 0 ${order}`;
    case "price_desc":
      return `COALESCE(price_meta.meta_value, '0') + 0 ${order}`;
    case "date_added":
    default:
      return `p.post_date ${order}`;
  }
};
