import { useQuery } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';

// Normalizes single product object returned from /api/v1/dash/products
const normalizeDashProduct = (p) => {
  if (!p || typeof p !== 'object') return null;
  const id = p._id ? String(p._id) : (p.id ? String(p.id) : (p.did || ''));
  const did = p.did || id;
  const name = p.name || 'Untitled Product';
  const sku = p.sku || did || '—';

  let price = 0;
  if (p.price !== undefined && p.price !== null) price = Number(p.price);
  else if (p.salePrice !== undefined && p.salePrice !== null) price = Number(p.salePrice);
  else if (p.offerPrice !== undefined && p.offerPrice !== null) price = Number(p.offerPrice);
  else if (Array.isArray(p.variants) && p.variants.length > 0 && p.variants[0]?.price) {
    price = Number(p.variants[0].price);
  }

  const rawImg =
    p.image ||
    p.imageUrl ||
    p.image_url ||
    p.thumbnailUrl ||
    p.thumbnail_url ||
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '') ||
    '';

  const image = resolveImageUrl(rawImg);
  const rawStatus = String(p.stockStatus || '').toLowerCase().trim();
  const isOutOfStock =
    rawStatus === 'outofstock' ||
    rawStatus === 'out_of_stock' ||
    rawStatus === 'out of stock';

  const stockStatus = isOutOfStock ? 'Out of Stock' : 'In Stock';

  return {
    ...p,
    id,
    _id: id,
    did,
    name,
    sku,
    price,
    image,
    stockStatus,
    isOutOfStock,
  };
};

// Executes POST /api/v1/dash/products aggregation query
const fetchDashProducts = async (payload = {}) => {
  const response = await apiClient.post('/api/v1/dash/products', payload);
  const data = response.data?.data || [];
  const pagination = response.data?.pagination || {
    total: data.length,
    page: payload.page || 1,
    limit: payload.limit || 20,
    totalPages: 1,
  };

  return {
    data: data.map(normalizeDashProduct).filter(Boolean),
    pagination,
  };
};

// React Query hook for high-performance dashboard product search with joins
export const useDashProducts = (payload = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ['dash-products-search', payload],
    queryFn: () => fetchDashProducts(payload),
    staleTime: 1000 * 30, // 30s cache
    keepPreviousData: true,
    ...queryOptions,
  });
};
