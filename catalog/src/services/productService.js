import { FALLBACK_PRODUCTS, resolveImageUrl } from '../data/fallbackProducts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.surokkha.store';

/**
 * Maps any backend category or slug to one of our 4 standard catalog categories:
 * - 'condom' (কনডম)
 * - 'spray' (লং টাইম স্প্রে)
 * - 'lubricant' (লুব্রিকেন্ট জেল)
 * - 'combo' (কম্বো অফার)
 */
export const normalizeCategory = (categoryInput, slug = '') => {
  const cat = typeof categoryInput === 'string' ? categoryInput.toLowerCase() : (categoryInput?.slug || categoryInput?.name || '').toLowerCase();
  const s = (slug || '').toLowerCase();

  if (s.includes('combo') || cat.includes('combo') || s.includes('variety') || s.includes('20-pcs') || s.includes('30-pcs')) {
    return 'combo';
  }
  if (cat.includes('spray') || cat.includes('booster') || cat.includes('delay') || s.includes('maxman') || s.includes('viga')) {
    return 'spray';
  }
  if (cat.includes('lubricant') || cat.includes('jelly') || cat.includes('gel') || s.includes('ky-jelly')) {
    return 'lubricant';
  }
  return 'condom';
};

/**
 * Synchronizes and enriches raw API product with explicit catalog details and images
 */
export const normalizeProduct = (apiItem) => {
  // Find matching fallback item by slug or id
  const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === apiItem.slug || p.id === apiItem.id) || null;

  const slug = apiItem.slug || fallback?.slug || '';
  const category = normalizeCategory(apiItem.category || apiItem.category_id || fallback?.category, slug);

  // Compute primary image URL
  const rawImage = apiItem.imageUrl || apiItem.image_url || apiItem.product_image || apiItem.image || fallback?.imageUrl || '';
  const imageUrl = resolveImageUrl(rawImage);

  // Compute gallery images
  let images = [];
  if (Array.isArray(apiItem.gallery_images) && apiItem.gallery_images.length > 0) {
    images = apiItem.gallery_images.map(resolveImageUrl);
  } else if (Array.isArray(apiItem.images) && apiItem.images.length > 0) {
    images = apiItem.images.map(resolveImageUrl);
  } else if (fallback?.images) {
    images = fallback.images;
  }
  if (images.length === 0 && imageUrl) {
    images = [imageUrl];
  }

  const regularPrice = Number(apiItem.regularPrice ?? apiItem.regular_price ?? apiItem.price ?? fallback?.regularPrice ?? 0);
  const offerPrice = Number(apiItem.offerPrice ?? apiItem.offer_price ?? apiItem.sale_price ?? apiItem.salePrice ?? fallback?.offerPrice ?? regularPrice);
  const discountPercentage = fallback?.discountPercentage ?? (regularPrice > offerPrice ? Math.round(((regularPrice - offerPrice) / regularPrice) * 100) : 0);

  // Use explicit catalog title if available, otherwise API title
  const name = fallback?.name || apiItem.name || apiItem.title || '';
  const name_bn = fallback?.name_bn || apiItem.name_bn || apiItem.data_bn?.name || apiItem.name || '';
  const packSize = fallback?.packSize || apiItem.packSize || apiItem.packageContents || '';
  const description = fallback?.description || apiItem.description || apiItem.data_bn?.description || '';
  const tagline = fallback?.tagline || apiItem.tagline || apiItem.data_bn?.tagline || '';
  const technicalSpecs = fallback?.technicalSpecs || apiItem.specifications || {};
  const benefits = fallback?.benefits || [];
  const brand = fallback?.brand || (Array.isArray(apiItem.brand) ? apiItem.brand[0]?.name : apiItem.brand) || 'Surokkha';

  const stockStatus = apiItem.stockStatus || apiItem.stock_status || fallback?.stockStatus || 'instock';
  const isOutOfStock = stockStatus === 'outofstock' || apiItem.isOutOfStock === true || (apiItem.stockAmount !== undefined && apiItem.stockAmount <= 0);

  return {
    id: apiItem.id || apiItem._id || fallback?.id || slug,
    slug,
    name,
    name_bn,
    category,
    category_name: category === 'spray' ? 'লং টাইম স্প্রে' : category === 'lubricant' ? 'লুব্রিকেন্ট জেল' : category === 'combo' ? 'কম্বো অফার' : 'কনডম',
    brand,
    regularPrice,
    offerPrice,
    discountPercentage,
    packSize,
    stockStatus,
    isOutOfStock,
    imageUrl,
    images,
    tagline,
    description,
    technicalSpecs,
    benefits,
  };
};

const fetchEndpoint = async (url, signal) => {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
};

/**
 * Fetches products + items from live API, merges, and falls back to local dataset on failure
 */
export const fetchCatalogProducts = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const [productItems, customItems] = await Promise.all([
      fetchEndpoint(`${API_BASE_URL}/api/v1/products?limit=200&isActive=true`, controller.signal),
      fetchEndpoint(`${API_BASE_URL}/api/v1/items?limit=200&isActive=true`, controller.signal),
    ]);

    clearTimeout(timeoutId);

    const seen = new Set();
    const rawList = [...productItems, ...customItems].filter((p) => {
      const key = p.slug || p.id || p._id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (rawList.length === 0) {
      console.warn('[Catalog] API returned empty data, using fallbackProducts');
      return FALLBACK_PRODUCTS;
    }

    const normalized = rawList.map(normalizeProduct);

    const existingSlugs = new Set(normalized.map((p) => p.slug));
    const missingFallbacks = FALLBACK_PRODUCTS.filter((p) => !existingSlugs.has(p.slug));

    return [...normalized, ...missingFallbacks];
  } catch (err) {
    console.warn('[Catalog] Network or fetch error, falling back to local dataset:', err?.message || err);
    return FALLBACK_PRODUCTS;
  }
};
