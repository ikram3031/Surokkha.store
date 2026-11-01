// A product belongs to the MO line when its dashboard brand is "MO".
// Products with no brand set fall back to the slug/name check, so older data still works.
export const isMoProduct = (p, key = '') => {
  if (!p) return false;
  const brands = [p.brandName, ...(Array.isArray(p.brandNames) ? p.brandNames : [])]
    .map((b) => String(b || '').trim().toLowerCase())
    .filter(Boolean);
  if (brands.length > 0) return brands.includes('mo');
  const slug = String(p.slug || key).toLowerCase();
  const name = String(p.name || '');
  return /(^|-)mo-/.test(slug) || /\bMO\b/.test(name) || name.includes('এমও');
};
