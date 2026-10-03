import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import clientConfig from '@/clientConfig';

const CATEGORY_STORAGE_KEY = 'ecom_category_cache';
const BRAND_STORAGE_KEY = 'ecom_brand_cache';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// ─── Category Cache Helpers ──────────────────────────────────────────────────

export function getCategoryCache() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.categories ?? [];
  } catch {
    return [];
  }
}

export function getCategoryName(val) {
  if (!val) return null;
  const strVal = String(val).trim();
  if (!strVal) return null;

  const cache = getCategoryCache();
  const found = cache.find(
    (c) =>
      (c.did && c.did === strVal) ||
      (c._id && String(c._id) === strVal) ||
      (c.id && String(c.id) === strVal) ||
      (c.slug && c.slug.toLowerCase() === strVal.toLowerCase()) ||
      (c.name && c.name.toLowerCase() === strVal.toLowerCase())
  );
  return found?.name ?? null;
}

export function getCategoryNamesByDids(dids) {
  if (!dids || dids.length === 0) return [];
  return dids.map((d) => getCategoryName(d)).filter(Boolean);
}

// ─── Brand Cache Helpers ─────────────────────────────────────────────────────

export function getBrandCache() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.brands ?? [];
  } catch {
    return [];
  }
}

export function getBrandName(val) {
  if (!val) return null;
  const strVal = String(val).trim();
  if (!strVal) return null;

  const cache = getBrandCache();
  const found = cache.find(
    (b) =>
      (b.did && b.did === strVal) ||
      (b._id && String(b._id) === strVal) ||
      (b.id && String(b.id) === strVal) ||
      (b.slug && b.slug.toLowerCase() === strVal.toLowerCase()) ||
      (b.name && b.name.toLowerCase() === strVal.toLowerCase())
  );
  return found?.name ?? null;
}

export function getBrandNamesByDids(dids) {
  if (!dids || dids.length === 0) return [];
  return dids.map((d) => getBrandName(d)).filter(Boolean);
}

// ─── TanStack Query Hooks ────────────────────────────────────────────────────

const isCategoryApiItem = (item) =>
  typeof item === 'object' &&
  item !== null &&
  typeof item.name === 'string';

const isBrandApiItem = (item) =>
  typeof item === 'object' &&
  item !== null &&
  typeof item.name === 'string';

export function useCategories() {
  return useQuery({
    queryKey: ['categories-cache'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/categories');
      const responseData = response.data;
      const rawData = Array.isArray(responseData) ? responseData : responseData?.data ?? [];
      const categories = (Array.isArray(rawData) ? rawData : [])
        .filter(isCategoryApiItem)
        .map((c) => ({
          id: c.id ? String(c.id) : undefined,
          _id: c._id ? String(c._id) : undefined,
          did: c.did ?? c.slug ?? String(c._id || c.id || ''),
          name: c.name,
          slug: c.slug ?? '',
          description: c.description ?? '',
          imageUrl: c.imageUrl ?? '',
          parent: c.parent ?? null,
        }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify({ fetchedAt: Date.now(), categories }));
      }
      return categories;
    },
    staleTime: CACHE_TTL_MS,
  });
}

export function useBrands() {
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;
  return useQuery({
    queryKey: ['brands-cache'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/brands', {
        params: { limit: 1000 },
      });
      const responseData = response.data;
      const rawData = Array.isArray(responseData) ? responseData : responseData?.data ?? [];
      const brands = (Array.isArray(rawData) ? rawData : [])
        .filter(isBrandApiItem)
        .map((b) => ({
          id: b.id ? String(b.id) : undefined,
          _id: b._id ? String(b._id) : undefined,
          did: b.did ?? b.slug ?? String(b._id || b.id || ''),
          name: b.name,
          slug: b.slug ?? '',
          parent: b.parent,
        }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify({ fetchedAt: Date.now(), brands }));
      }
      return brands;
    },
    enabled: hasBrand,
    staleTime: CACHE_TTL_MS,
  });
}

// ─── Loader Component ────────────────────────────────────────────────────────

export function MetadataCacheLoader() {
  useCategories();
  useBrands();
  return null;
}
