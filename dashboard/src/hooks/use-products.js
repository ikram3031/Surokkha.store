import { useQuery } from '@tanstack/react-query';
import { apiClient, baseURL } from '@/lib/api-client';
import { getCategoryName, getBrandName } from '@/lib/category-cache';

const API_BASE = (baseURL || '').replace(/\/$/, '');

const resolveImageUrl = (raw) => {
  if (!raw) return undefined;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

const fetchProducts = async (params) => {
  const limit = params?.limit ?? 15;
  const page = params?.page ?? 1;
  const skip = (page - 1) * limit;

  const queryParams = { skip, limit };
  if (params?.search && params.search.trim() !== '') {
    queryParams.q = params.search.trim();
  }
  if (params?.category) queryParams.category = params.category;
  if (params?.brand) queryParams.brand = params.brand;
  if (params?.stockStatus && params.stockStatus !== 'all') queryParams.stockStatus = params.stockStatus;
  if (params?.onSale) queryParams.onSale = true;

  const response = await apiClient.get('/api/v1/products', { params: queryParams });

  const responseData = response.data;
  let productList = [];
  let rawMeta = null;

  if (Array.isArray(responseData)) {
    productList = responseData;
  } else if (
    responseData &&
    typeof responseData === 'object' &&
    'data' in responseData &&
    Array.isArray(responseData.data)
  ) {
    productList = responseData.data;
    if (responseData.pagination && typeof responseData.pagination === 'object') {
      rawMeta = responseData.pagination;
    } else if (responseData.meta && typeof responseData.meta === 'object') {
      rawMeta = responseData.meta;
    }
  }

  const mappedProducts = productList.map((p) => {
    // Resolves primary category name from populated object, categories array, or cache
    const categoryName = (() => {
      if (p.category && typeof p.category === 'object' && p.category.name) {
        return p.category.name;
      }
      const rawCats = Array.isArray(p.categories) ? p.categories : typeof p.categories === 'string' ? [p.categories] : [];
      if (rawCats.length > 0) {
        const firstCat = rawCats[0];
        if (typeof firstCat === 'string') {
          return getCategoryName(firstCat) || firstCat;
        } else if (typeof firstCat === 'object' && firstCat !== null && 'name' in firstCat && firstCat.name) {
          return firstCat.name;
        }
      }
      return 'Uncategorized';
    })();

    const productType = p.type === 'variant' ? 'variant' : 'simple';

    const variants = Array.isArray(p.variants)
      ? p.variants.map((v) => ({
          size: v.size ?? '',
          price: Number(v.price ?? 0),
          offerPrice: v.offerPrice != null ? Number(v.offerPrice) : null,
          stockQuantity: Number(v.stockQuantity ?? 0),
          stockStatus: v.stockStatus || 'instock',
          sku: v.sku ?? '',
          sortOrder: Number(v.sortOrder ?? 0),
        }))
      : [];

    // Resolve brand name from did
    const brandName = (() => {
      const rawBrands = Array.isArray(p.brand) ? p.brand : typeof p.brand === 'string' ? [p.brand] : [];
      if (rawBrands.length > 0 && typeof rawBrands[0] === 'string') {
        return getBrandName(rawBrands[0]) || rawBrands[0];
      }
      return undefined;
    })();

    return {
      id: p.id || p._id || "UNKNOWN",
      name: p.name || "",
      sku: p.sku || p.did || "SKU-UNKNOWN",
      category: categoryName,
      brand: brandName,
      price: Number(p.price ?? 0),
      offerPrice: p.offerPrice != null ? Number(p.offerPrice) : null,
      stock: typeof p.stockAmount === "number" ? p.stockAmount : (typeof p.stock === "number" ? p.stock : Number(p.stockQuantity ?? 10)),
      stockAmount: typeof p.stockAmount === "number" ? p.stockAmount : 0,
      stockStatus: p.stockStatus || "instock",
      status: (p.stockStatus || "instock") === "instock" ? "In Stock" : "Out of Stock",
      image: resolveImageUrl(p.imageUrl || p.thumbnailUrl || p.image_url || p.thumbnail_url),
      type: productType,
      variants,
    };
  });

  const total = rawMeta?.total_products ?? rawMeta?.total ?? mappedProducts.length;
  const metaLimit = rawMeta?.limit ?? limit;
  const metaPage = rawMeta?.current_page ?? rawMeta?.page ?? (Math.floor(skip / metaLimit) + 1);
  const totalPages = rawMeta?.total_pages ?? rawMeta?.totalPages ?? (Math.ceil(total / metaLimit) || 1);

  return {
    data: mappedProducts,
    meta: {
      total,
      page: metaPage,
      limit: metaLimit,
      totalPages,
    },
  };
};

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
  });
}
