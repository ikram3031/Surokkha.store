import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Download,
  Copy,
  Search,
  Settings2,
  Table as TableIcon,
  ShoppingBag,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Check,
  CheckSquare,
  Square,
  CheckCheck,
  FileSpreadsheet,
  Globe,
  Archive,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient, baseURL } from '@/lib/api-client';
import { clientConfig } from '@/clientConfig';
import { useCategories } from '@/lib/category-cache';
import { toast } from 'sonner';
import {
  exportToCsv,
  exportToXlsx,
  downloadDualSiteZip,
  generateCsvString as serializeCsv,
} from '@/lib/excel-export';

const META_CSV_COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'link',
  'image_link',
  'brand',
  'price',
  'google_product_category',
  'fb_product_category',
  'product_type',
  'quantity_to_sell_on_facebook',
  'sale_price',
  'sale_price_effective_date',
  'item_group_id',
  'gender',
  'color',
  'size',
  'age_group',
  'material',
  'pattern',
  'shipping',
  'shipping_weight',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
  'offer_disclaimer',
  'offer_disclaimer_url',
  'video[0].url',
  'video[0].tag[0]',
  'gtin',
  'product_tags[0]',
  'product_tags[1]',
  'style[0]',
];

// Helper to strip HTML tags from product descriptions
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to escape values for RFC 4180 CSV compliance
const escapeCsvCell = (str) => {
  if (str === null || str === undefined) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

// Helper to convert text to URL slug
const slugify = (text) => {
  if (!text) return 'general';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
};

// Helper to construct full product URL based on dynamic pattern
const buildProductUrl = (pattern, product, siteUrl) => {
  const cleanSiteUrl = (siteUrl || '').replace(/\/$/, '');
  const catSlug = product.primaryCategorySlug || slugify(product.primaryCategory || 'general');
  const brandSlug = product.brandSlug || slugify(product.brand || 'brand');
  const pSlug = product.slug || product.did || product.id || '';

  const routePattern = pattern || clientConfig?.routes?.product || '/shop/:category/:slug';

  if (!routePattern.includes(':') && !routePattern.includes('{')) {
    const cleanPrefix = routePattern.startsWith('/') ? routePattern : `/${routePattern}`;
    const fmtPrefix = cleanPrefix.endsWith('/') ? cleanPrefix : `${cleanPrefix}/`;
    return `${cleanSiteUrl}${fmtPrefix}${pSlug}`;
  }

  let path = routePattern
    .replace(':category', catSlug)
    .replace('{category}', catSlug)
    .replace(':brand', brandSlug)
    .replace('{brand}', brandSlug)
    .replace(':slug', pSlug)
    .replace('{slug}', pSlug)
    .replace(':productSlug', pSlug)
    .replace('{productSlug}', pSlug);

  if (!path.startsWith('/')) path = '/' + path;
  return `${cleanSiteUrl}${path}`;
};

const getDynamicDefaults = () => {
  const detectedStorefront =
    clientConfig?.storefrontUrl ||
    (clientConfig?.domain ? `https://${clientConfig.domain.replace(/^https?:\/\//, '')}` : null) ||
    (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname.replace(/^admin\./, '')}`
      : 'https://example.com');

  const detectedApiBase = (
    clientConfig?.apiBaseUrl ||
    baseURL ||
    (typeof window !== 'undefined'
      ? `${window.location.protocol}//api.${window.location.hostname.replace(/^admin\./, '')}`
      : 'https://api.example.com')
  ).replace(/\/$/, '');

  const defaultProductPattern = clientConfig?.routes?.product || '/shop/:category/:slug';

  return {
    siteUrl: detectedStorefront.replace(/\/$/, ''),
    imageBaseUrl: detectedApiBase,
    productPathPrefix: defaultProductPattern,
    idMapping: 'did',
    defaultCondition: 'new',
    googleCategory: '',
    customLabel0: '',
    includeVariants: false,
  };
};

const getClientStorageKey = (baseKey) => {
  const clientKey = clientConfig?.clientKey || clientConfig?.brandName?.toLowerCase() || 'default';
  return `${baseKey}_${clientKey}`;
};

// Restores persisted feed configuration dynamically scoped per client
const getSavedSettings = () => {
  const defaults = getDynamicDefaults();
  try {
    const key = getClientStorageKey('meta_catalog_settings');
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        siteUrl: parsed.siteUrl || defaults.siteUrl,
        imageBaseUrl: parsed.imageBaseUrl || defaults.imageBaseUrl,
      };
    }
  } catch (_) {}
  return defaults;
};

// Main Meta Catalog Feed Generator and CSV Builder component
const MetaCatalogGenerator = () => {
  const { data: dbCategories = [] } = useCategories();

  // Products & Infinite Scroll State
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Settings State (Scoped dynamically to current client)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initialSettings = useMemo(() => getSavedSettings(), []);

  const [siteUrl, setSiteUrl] = useState(initialSettings.siteUrl);
  const [productPathPrefix, setProductPathPrefix] = useState(initialSettings.productPathPrefix);
  const [imageBaseUrl, setImageBaseUrl] = useState(initialSettings.imageBaseUrl);
  const currency = 'BDT';
  const [idMapping, setIdMapping] = useState(initialSettings.idMapping);
  const [defaultCondition, setDefaultCondition] = useState(initialSettings.defaultCondition);
  const [googleCategory, setGoogleCategory] = useState(initialSettings.googleCategory);
  const [customLabel0, setCustomLabel0] = useState(initialSettings.customLabel0);
  const [includeVariants, setIncludeVariants] = useState(initialSettings.includeVariants);

  // Multi-site configuration detection (Store: surokkha.store, Shop: surokkha.shop)
  const configuredSites = useMemo(() => {
    if (clientConfig?.sites && typeof clientConfig.sites === 'object') {
      return Object.entries(clientConfig.sites).map(([key, site]) => ({
        key,
        name: site.name || (key === 'store' ? 'Surokkha Store' : key === 'shop' ? 'Surokkha Shop' : key),
        domain: site.domain || (key === 'store' ? 'surokkha.store' : 'surokkha.shop'),
        url: (site.url || site.storefrontUrl || (site.domain ? `https://${site.domain}` : '')).replace(/\/$/, ''),
        pixelId: site.metaPixel?.pixelId || '',
      }));
    }
    return [
      {
        key: 'store',
        name: 'Surokkha Store',
        domain: 'surokkha.store',
        url: 'https://surokkha.store',
        pixelId: '',
      },
      {
        key: 'shop',
        name: 'Surokkha Shop',
        domain: 'surokkha.shop',
        url: 'https://surokkha.shop',
        pixelId: '',
      },
    ];
  }, []);

  const [activeSiteKey, setActiveSiteKey] = useState(() => {
    return configuredSites.length > 0 ? configuredSites[0].key : 'store';
  });

  const activeSite = useMemo(() => {
    return configuredSites.find((s) => s.key === activeSiteKey) || configuredSites[0] || {
      key: 'store',
      name: clientConfig?.brandName || 'Store',
      domain: clientConfig?.domain || 'surokkha.store',
      url: siteUrl || 'https://surokkha.store',
      pixelId: '',
    };
  }, [configuredSites, activeSiteKey, siteUrl]);

  const storeSite = useMemo(() => {
    return configuredSites.find((s) => s.key === 'store') || {
      key: 'store',
      name: 'Surokkha Store',
      domain: 'surokkha.store',
      url: 'https://surokkha.store',
      pixelId: '',
    };
  }, [configuredSites]);

  const shopSite = useMemo(() => {
    return configuredSites.find((s) => s.key === 'shop') || {
      key: 'shop',
      name: 'Surokkha Shop',
      domain: 'surokkha.shop',
      url: 'https://surokkha.shop',
      pixelId: '',
    };
  }, [configuredSites]);

  // Staged Catalog State (with LocalStorage restore scoped per client)
  const [stagedMap, setStagedMap] = useState(() => {
    try {
      const stagedKey = getClientStorageKey('meta_catalog_staged');
      const saved = localStorage.getItem(stagedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Map(parsed.map((item) => [item.did || item.id, item]));
        }
      }
    } catch (_) {}
    return new Map();
  });

  // Save settings to LocalStorage scoped per client
  useEffect(() => {
    try {
      const settingsKey = getClientStorageKey('meta_catalog_settings');
      localStorage.setItem(
        settingsKey,
        JSON.stringify({
          siteUrl,
          productPathPrefix,
          imageBaseUrl,
          idMapping,
          defaultCondition,
          googleCategory,
          customLabel0,
          includeVariants,
        })
      );
    } catch (_) {}
  }, [
    siteUrl,
    productPathPrefix,
    imageBaseUrl,
    idMapping,
    defaultCondition,
    googleCategory,
    customLabel0,
    includeVariants,
  ]);

  // Save stagedMap to LocalStorage scoped per client
  useEffect(() => {
    try {
      const stagedKey = getClientStorageKey('meta_catalog_staged');
      const arrayData = Array.from(stagedMap.values());
      localStorage.setItem(stagedKey, JSON.stringify(arrayData));
    } catch (_) {}
  }, [stagedMap]);

  // Filters & UI State
  const [checkedIds, setCheckedIds] = useState(new Set()); // For bulk adding visible items
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('instock'); // Default to in-stock
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'staged' | 'preview'

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const fetchCountRef = useRef(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const resolveAbsoluteImageUrl = useCallback(
    (img) => {
      if (!img) return '';
      if (typeof img !== 'string') return '';
      if (img.startsWith('http://') || img.startsWith('https://')) return img;
      const base = imageBaseUrl.replace(/\/$/, '');
      const cleanPath = img.startsWith('/') ? img : `/${img}`;
      return `${base}${cleanPath}`;
    },
    [imageBaseUrl]
  );

  // Parse Raw Product
  const normalizeProduct = useCallback(
    (p) => {
      const id = p.id || p._id || p.did || '';
      const did = p.did || id;
      const sku = p.sku || did;
      const name = p.name || 'Untitled Product';
      const slug = p.slug || did;

      // Extract Categories
      const catList = [];
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c) => {
          if (typeof c === 'string') catList.push(c);
          else if (c && typeof c === 'object') {
            if (c.name) catList.push(c.name);
            if (c.slug) catList.push(c.slug);
            if (c.did) catList.push(c.did);
          }
        });
      } else if (p.category) {
        if (typeof p.category === 'string') catList.push(p.category);
        else if (p.category.name) catList.push(p.category.name);
      }

      // Brand
      let brandName = clientConfig?.brandName || 'Brand';
      if (Array.isArray(p.brand) && p.brand.length > 0 && typeof p.brand[0] === 'string') {
        brandName = p.brand[0];
      } else if (typeof p.brand === 'string' && p.brand.trim()) {
        brandName = p.brand;
      }

      // Variants
      const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
      const variants = hasVariants
        ? p.variants.map((v, i) => {
            const vPrice = Number(v.price ?? p.price ?? 0);
            const vOffer =
              v.offerPrice !== undefined && v.offerPrice !== null && Number(v.offerPrice) > 0
                ? Number(v.offerPrice)
                : null;
            return {
              id: `${did}_${v.sku || v.name || i + 1}`,
              sku: v.sku || `${sku}-${i + 1}`,
              name: v.name || v.size || v.color || `Variant ${i + 1}`,
              price: vPrice,
              offerPrice: vOffer,
              stockQuantity: Number(v.stockQuantity ?? 10),
              imageUrl: resolveAbsoluteImageUrl(v.imageUrl || v.image) || resolveAbsoluteImageUrl(p.imageUrl),
              color: v.color || '',
              size: v.size || '',
            };
          })
        : [];

      // Determine price range or exact price
      let minPrice = Number(p.price || 0);
      let maxPrice = minPrice;
      let effectiveOfferPrice =
        p.offerPrice !== undefined && p.offerPrice !== null && Number(p.offerPrice) > 0
          ? Number(p.offerPrice)
          : p.salePrice !== undefined && p.salePrice !== null && Number(p.salePrice) > 0
          ? Number(p.salePrice)
          : null;

      if (hasVariants) {
        const varPrices = variants.map((v) => v.price).filter((pr) => pr > 0);
        if (varPrices.length > 0) {
          minPrice = Math.min(...varPrices);
          maxPrice = Math.max(...varPrices);
        }
        const varOffers = variants
          .map((v) => v.offerPrice)
          .filter((op) => op !== null && op > 0);
        if (varOffers.length > 0) {
          effectiveOfferPrice = Math.min(...varOffers);
        }
      }

      // Stock
      const stockAmount =
        typeof p.stockAmount === 'number'
          ? p.stockAmount
          : typeof p.stock === 'number'
          ? p.stock
          : typeof p.stockQuantity === 'number'
          ? p.stockQuantity
          : 10;
      const isInstock =
        (p.stockStatus === 'instock' || p.stockStatus === 'in_stock' || stockAmount > 0) &&
        p.stockStatus !== 'outofstock';

      // Image
      const imgRaw =
        p.imageUrl ||
        p.image_url ||
        p.thumbnailUrl ||
        p.thumbnail_url ||
        (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);

      const imgUrl = resolveAbsoluteImageUrl(imgRaw);

      // Extract category slug
      let primaryCategorySlug = '';
      if (Array.isArray(p.categories) && p.categories.length > 0) {
        const first = p.categories[0];
        if (typeof first === 'object' && first?.slug) primaryCategorySlug = first.slug;
      } else if (p.category && typeof p.category === 'object' && p.category.slug) {
        primaryCategorySlug = p.category.slug;
      }

      return {
        id,
        did,
        sku,
        name,
        slug,
        categories: catList,
        primaryCategory: catList[0] || 'General',
        primaryCategorySlug,
        brand: brandName,
        price: minPrice,
        maxPrice,
        hasPriceRange: hasVariants && minPrice !== maxPrice,
        offerPrice: effectiveOfferPrice,
        stockAmount,
        isInstock,
        hasVariants,
        variants,
        description: p.description || p.shortDescription || p.name || '',
        imageUrl: imgUrl,
      };
    },
    [resolveAbsoluteImageUrl]
  );

  // Fetch Page of Products (20 at a time)
  const fetchProductsPage = async (pageNum, isReset = false) => {
    const currentFetchId = ++fetchCountRef.current;
    setIsLoading(true);
    if (isReset) setIsInitialLoading(true);

    try {
      const params = {
        limit: 20,
        skip: (pageNum - 1) * 20,
      };

      if (debouncedSearch.trim()) {
        params.q = debouncedSearch.trim();
      }

      if (stockFilter && stockFilter !== 'all') {
        params.stockStatus = stockFilter;
      }

      if (selectedCategories.length > 0) {
        const catKeys = selectedCategories
          .map((c) => c.slug || c.did || c.name || c.id)
          .filter(Boolean);
        if (catKeys.length > 0) {
          params.category = catKeys.join(',');
        }
      }

      params.filter = { excludeFromMetaCatalog: { $ne: true } };
      const response = await apiClient.post('/api/v1/products/search', params);

      // Ignore response if another fetch was dispatched
      if (currentFetchId !== fetchCountRef.current) return;

      let rawList = [];
      let totalCount = 0;

      const resData = response.data;
      if (Array.isArray(resData)) {
        rawList = resData;
        totalCount = resData.length;
      } else if (resData && Array.isArray(resData.data)) {
        rawList = resData.data;
        totalCount = resData.pagination?.total ?? resData.total ?? resData.data.length;
      } else if (resData && Array.isArray(resData.products)) {
        rawList = resData.products;
        totalCount = resData.total ?? resData.products.length;
      }

      const normalized = rawList.map(normalizeProduct);

      if (isReset) {
        setProducts(normalized);
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = normalized.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }

      setTotalProducts(totalCount);
      setHasMore(normalized.length === 20 && pageNum * 20 < totalCount);
    } catch (err) {
      console.error('Failed to fetch products page:', err);
      toast.error('Failed to load products.');
    } finally {
      if (currentFetchId === fetchCountRef.current) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    }
  };

  // Reset and reload when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProductsPage(1, true);
  }, [debouncedSearch, stockFilter, selectedCategories]);

  // Infinite Scroll Trigger with IntersectionObserver
  useEffect(() => {
    if (activeTab !== 'browse') return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchProductsPage(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, activeTab]);

  // Categories list for Dropdown
  const categoryOptions = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        id: String(c.did || c.slug || c._id || c.id || c.name),
        name: c.name,
        slug: c.slug || '',
        did: c.did || '',
        _id: c._id || c.id || '',
      }));
    }
    return [];
  }, [dbCategories]);

  // Filtered categories based on in-dropdown search
  const filteredCategoryOptions = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoryOptions;
    const q = categorySearchQuery.toLowerCase().trim();
    return categoryOptions.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categoryOptions, categorySearchQuery]);

  // Staged Add / Remove
  const toggleStageProduct = (product) => {
    const id = product.did || product.id;
    setStagedMap((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, product);
      }
      return next;
    });
  };

  // Bulk Check / Uncheck in Grid
  const toggleCheckProduct = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all visible on current screen
  const selectAllVisible = () => {
    if (checkedIds.size === products.length && products.length > 0) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(products.map((p) => p.did || p.id)));
    }
  };

  // Bulk Add Checked to Staged Catalog
  const addCheckedToCatalog = () => {
    if (checkedIds.size === 0) {
      toast.info('Please select at least 1 item checkbox first.');
      return;
    }
    const newMap = new Map(stagedMap);
    let addedCount = 0;
    products.forEach((p) => {
      const id = p.did || p.id;
      if (checkedIds.has(id)) {
        if (!newMap.has(id)) addedCount++;
        newMap.set(id, p);
      }
    });
    setStagedMap(newMap);
    setCheckedIds(new Set());
    toast.success(`Added ${addedCount} product(s) to catalog feed.`);
  };

  // Add all currently loaded to Catalog
  const addAllLoadedToCatalog = () => {
    const newMap = new Map(stagedMap);
    products.forEach((p) => {
      const id = p.did || p.id;
      newMap.set(id, p);
    });
    setStagedMap(newMap);
    toast.success(`Added all ${products.length} loaded product(s) to catalog.`);
  };

  // Remove single item from feed
  const removeStagedItem = (id) => {
    setStagedMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  // Clear all staged
  const clearAllStaged = () => {
    setStagedMap(new Map());
    toast.info('Cleared catalog feed.');
  };

  // Toggle category multi-select
  const toggleCategorySelection = (cat) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((c) => c.name === cat.name || c.id === cat.id);
      if (exists) return prev.filter((c) => c.name !== cat.name && c.id !== cat.id);
      return [...prev, cat];
    });
  };

  // Generates Catalog Rows according to Meta specifications for a specific target site URL
  const generateRowsForSite = useCallback(
    (targetSiteUrl) => {
      const rows = [];
      const cleanSite = (targetSiteUrl || siteUrl).replace(/\/$/, '');

      stagedMap.forEach((p) => {
        const cleanDesc = stripHtml(p.description || p.name || 'Quality product.');
        const brandName = p.brand || clientConfig?.brandName || 'Store';
        const productLink = buildProductUrl(productPathPrefix, p, cleanSite);
        const formatImageForMeta = (img) => {
          if (!img) return '';
          return img.endsWith('.webp') ? img.replace(/\.webp$/, '.jpg') : img;
        };
        const mainImage = formatImageForMeta(p.imageUrl);
        const productTypeCategory = p.primaryCategory || 'General';

        let contentId = p.did || p.id;
        if (idMapping === 'sku' && p.sku) contentId = p.sku;
        else if (idMapping === 'id' && p.id) contentId = String(p.id);
        else if (idMapping === 'slug' && p.slug) contentId = String(p.slug);

        if (includeVariants && p.hasVariants && p.variants.length > 0) {
          p.variants.forEach((v) => {
            const varPrice = Number(v.price || 0);
            const varSalePrice = v.offerPrice ? Number(v.offerPrice) : null;
            const varHasDiscount = varSalePrice != null && varSalePrice > 0 && varSalePrice < varPrice;

            rows.push({
              id: v.id || `${contentId}_${v.sku || 'v'}`,
              title: `${p.name} - ${v.name}`.trim(),
              description: cleanDesc,
              availability: (v.stockQuantity ?? 1) > 0 ? 'in stock' : 'out of stock',
              condition: defaultCondition,
              link: productLink,
              image_link: formatImageForMeta(v.imageUrl) || mainImage,
              brand: brandName,
              price: `${varPrice.toFixed(2)} ${currency}`,
              google_product_category: googleCategory || '',
              fb_product_category: '',
              product_type: productTypeCategory,
              quantity_to_sell_on_facebook: v.stockQuantity ?? 50,
              sale_price: varHasDiscount ? `${varSalePrice.toFixed(2)} ${currency}` : '',
              sale_price_effective_date: '',
              item_group_id: contentId,
              gender: 'unisex',
              color: v.color || '',
              size: v.size || '',
              age_group: 'adult',
              material: '',
              pattern: '',
              shipping: '',
              shipping_weight: '',
              custom_label_0: customLabel0 || '',
              custom_label_1: productTypeCategory,
              custom_label_2: '',
              custom_label_3: '',
              custom_label_4: '',
              offer_disclaimer: '',
              offer_disclaimer_url: '',
              'video[0].url': '',
              'video[0].tag[0]': '',
              gtin: '',
              'product_tags[0]': customLabel0 || '',
              'product_tags[1]': productTypeCategory,
              'style[0]': '',
            });
          });
        } else {
          const rawPrice = Number(p.price || 0);
          const rawSalePrice = p.offerPrice ? Number(p.offerPrice) : null;
          const hasDiscount = rawSalePrice != null && rawSalePrice > 0 && rawSalePrice < rawPrice;

          rows.push({
            id: contentId,
            title: p.name,
            description: cleanDesc,
            availability: p.isInstock ? 'in stock' : 'out of stock',
            condition: defaultCondition,
            link: productLink,
            image_link: mainImage,
            brand: brandName,
            price: `${rawPrice.toFixed(2)} ${currency}`,
            google_product_category: googleCategory || '',
            fb_product_category: '',
            product_type: productTypeCategory,
            quantity_to_sell_on_facebook: p.stockAmount ?? 50,
            sale_price: hasDiscount ? `${rawSalePrice.toFixed(2)} ${currency}` : '',
            sale_price_effective_date: '',
            item_group_id: '',
            gender: 'unisex',
            color: '',
            size: '',
            age_group: 'adult',
            material: '',
            pattern: '',
            shipping: '',
            shipping_weight: '',
            custom_label_0: customLabel0 || '',
            custom_label_1: productTypeCategory,
            custom_label_2: '',
            custom_label_3: '',
            custom_label_4: '',
            offer_disclaimer: '',
            offer_disclaimer_url: '',
            'video[0].url': '',
            'video[0].tag[0]': '',
            gtin: '',
            'product_tags[0]': customLabel0 || '',
            'product_tags[1]': productTypeCategory,
            'style[0]': '',
          });
        }
      });

      return rows;
    },
    [
      stagedMap,
      siteUrl,
      productPathPrefix,
      idMapping,
      defaultCondition,
      googleCategory,
      customLabel0,
      includeVariants,
      currency,
    ]
  );

  // Generate Catalog Rows according to Meta specifications for currently active site
  const catalogRows = useMemo(() => {
    return generateRowsForSite(activeSite.url);
  }, [generateRowsForSite, activeSite.url]);

  // Triggers browser download for Meta catalog CSV file for a specific site
  const handleDownloadSiteCsv = (targetSite) => {
    if (catalogRows.length === 0) {
      toast.error('No products added to catalog feed.');
      return;
    }
    const site = targetSite || activeSite;
    const rows = generateRowsForSite(site.url);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `meta_catalog_${site.key}_${dateStr}.csv`;
    exportToCsv(filename, META_CSV_COLUMNS, rows);
    toast.success(`${site.name} CSV (${rows.length} rows) downloaded! (Pixel: ${site.pixelId})`);
  };

  // Triggers browser download for Meta catalog Excel (.xlsx) file for a specific site
  const handleDownloadSiteXlsx = async (targetSite) => {
    if (catalogRows.length === 0) {
      toast.error('No products added to catalog feed.');
      return;
    }
    const site = targetSite || activeSite;
    const rows = generateRowsForSite(site.url);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `meta_catalog_${site.key}_${dateStr}.xlsx`;
    const sheetName = site.key === 'shop' ? 'ShopCatalog' : 'StoreCatalog';
    await exportToXlsx(filename, sheetName, META_CSV_COLUMNS, rows);
    toast.success(`${site.name} Excel (${rows.length} rows) downloaded! (Pixel: ${site.pixelId})`);
  };

  // Downloads both Store and Shop catalogs bundled in a single ZIP file
  const handleDownloadDualZip = async (format = 'csv') => {
    if (catalogRows.length === 0) {
      toast.error('No products added to catalog feed.');
      return;
    }
    const storeRows = generateRowsForSite(storeSite.url);
    const shopRows = generateRowsForSite(shopSite.url);
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadDualSiteZip({
      zipFilename: `meta_catalogs_dual_${format}_${dateStr}.zip`,
      storeRows,
      shopRows,
      columns: META_CSV_COLUMNS,
      format,
      storeName: 'store',
      shopName: 'shop',
      dateStr,
    });
    toast.success(`Dual Meta Catalog ZIP (${format.toUpperCase()}) downloaded successfully!`);
  };

  // Default download handler targeting active site
  const handleDownloadCsv = () => {
    handleDownloadSiteCsv(activeSite);
  };

  // Copies generated CSV text directly to clipboard for current active site
  const handleCopyCsv = () => {
    if (catalogRows.length === 0) {
      toast.error('No products in catalog feed.');
      return;
    }
    const csvContent = serializeCsv(META_CSV_COLUMNS, catalogRows);
    navigator.clipboard.writeText(csvContent);
    toast.success(`${activeSite.name} CSV copied to clipboard! (Pixel: ${activeSite.pixelId})`);
  };

  return (
    <div className="page-container flex-1 space-y-5 p-4 md:p-8 pt-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-3xl font-bold tracking-tight">Meta Catalog Feed</h2>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              Selected in Feed: {stagedMap.size} Items
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and export Meta Pixel & Commerce Manager compliant product catalogs for Surokkha Store and Shop.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="shadow-2xs text-xs"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Feed Settings
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCsv}
            disabled={catalogRows.length === 0}
            className="shadow-2xs text-xs"
            title={`Copy ${activeSite.name} CSV`}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy {activeSite.key === 'shop' ? 'Shop' : 'Store'} CSV
          </Button>

          {/* Dedicated Download Store CSV Button */}
          <Button
            size="sm"
            onClick={() => handleDownloadSiteCsv(storeSite)}
            disabled={catalogRows.length === 0}
            className="shadow-xs text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Store CSV
            <span className="ml-1.5 px-1 py-0.2 bg-emerald-800/60 rounded text-[10px] font-mono">
              .store
            </span>
          </Button>

          {/* Dedicated Download Shop CSV Button */}
          <Button
            size="sm"
            onClick={() => handleDownloadSiteCsv(shopSite)}
            disabled={catalogRows.length === 0}
            className="shadow-xs text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Shop CSV
            <span className="ml-1.5 px-1 py-0.2 bg-amber-800/60 rounded text-[10px] font-mono">
              .shop
            </span>
          </Button>

          {/* Excel & ZIP Download Dropdown */}
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled={catalogRows.length === 0}
              className="shadow-2xs text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Excel / ZIP
              <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
            </Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 min-w-[210px] rounded-lg border bg-popover p-1 text-xs shadow-lg space-y-0.5">
              <button
                type="button"
                onClick={() => handleDownloadSiteXlsx(storeSite)}
                className="flex items-center w-full px-2.5 py-1.5 rounded text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                Store Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSiteXlsx(shopSite)}
                className="flex items-center w-full px-2.5 py-1.5 rounded text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-amber-600" />
                Shop Excel (.xlsx)
              </button>
              <div className="border-t my-1" />
              <button
                type="button"
                onClick={() => handleDownloadDualZip('csv')}
                className="flex items-center w-full px-2.5 py-1.5 rounded text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <Archive className="h-3.5 w-3.5 mr-2 text-primary" />
                Download Both Sites (CSV ZIP)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDualZip('xlsx')}
                className="flex items-center w-full px-2.5 py-1.5 rounded text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <Archive className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                Download Both Sites (Excel ZIP)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Site Switcher Card Banner */}
      <div className="rounded-xl border bg-card/60 backdrop-blur-xs p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-xs font-semibold text-foreground">Target Storefront Catalog:</span>
              <p className="text-[11px] text-muted-foreground">Each site has its own distinct domain, product links, and Meta Pixel ID.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {configuredSites.map((site) => {
              const isSelected = site.key === activeSiteKey;
              return (
                <button
                  key={site.key}
                  type="button"
                  onClick={() => setActiveSiteKey(site.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                      : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-input'
                  }`}
                >
                  <span>{site.name}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Pixel: {site.pixelId}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('browse')}
            className="text-xs h-8"
          >
            <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
            Browse Inventory ({totalProducts})
          </Button>

          <Button
            variant={activeTab === 'staged' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('staged')}
            className="text-xs h-8 relative"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            Selected in Catalog
            <Badge className="ml-1.5 bg-emerald-500 text-white h-4 px-1.5 text-[10px]">
              {stagedMap.size}
            </Badge>
          </Button>

          <Button
            variant={activeTab === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('preview')}
            className="text-xs h-8"
          >
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Meta CSV Preview ({catalogRows.length} Rows)
          </Button>
        </div>

        {activeTab === 'staged' && stagedMap.size > 0 && (
          <Button
            variant="cancel"
            size="sm"
            onClick={clearAllStaged}
            className="text-xs h-8 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All Selected
          </Button>
        )}
      </div>

      {/* TAB 1: BROWSE INVENTORY (5-COLUMN PRODUCT CARDS WITH INFINITE SCROLL) */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="flex flex-1 items-center space-x-2 w-full lg:max-w-xs relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by title, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Multi-Select Dropdown with In-Dropdown Search */}
            <div className="relative flex-1 lg:max-w-sm">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex items-center justify-between w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-left hover:border-primary/50 transition-colors"
              >
                <span className="truncate">
                  {selectedCategories.length === 0
                    ? 'All Categories & Subcategories'
                    : `Filtered by ${selectedCategories.length} category`}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </button>

              {categoryDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setCategoryDropdownOpen(false)}
                  />
                  <div className="absolute top-10 left-0 right-0 z-50 rounded-lg border bg-popover p-2 shadow-xl max-h-72 overflow-y-auto space-y-1 text-xs">
                    {/* Header & Clear */}
                    <div className="flex items-center justify-between px-2 py-1 border-b mb-1">
                      <span className="font-semibold text-[11px] text-muted-foreground">Select Categories</span>
                      {selectedCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategories([])}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    {/* In-Dropdown Category Search */}
                    <div className="px-1 pb-1">
                      <Input
                        placeholder="Search categories..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="h-7 text-[11px] px-2"
                        autoFocus
                      />
                    </div>

                    {/* Category List */}
                    <div className="space-y-0.5 max-h-48 overflow-y-auto pt-1">
                      {filteredCategoryOptions.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground text-[11px]">
                          No categories found.
                        </div>
                      ) : (
                        filteredCategoryOptions.map((cat) => {
                          const isSelected = selectedCategories.some((c) => c.id === cat.id || c.name === cat.name);
                          return (
                            <div
                              key={cat.id}
                              onClick={() => toggleCategorySelection(cat)}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                              }`}
                            >
                              <span className="truncate">{cat.name}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stock Filter & Bulk Add Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-lg border bg-card p-0.5 text-xs">
                {[
                  { id: 'instock', label: 'In Stock Only' },
                  { id: 'all', label: 'All Stock' },
                  { id: 'outofstock', label: 'Out of Stock' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStockFilter(st.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      stockFilter === st.id
                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Select All Visible Toggle */}
              {products.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllVisible}
                  className="h-9 text-xs"
                  title="Toggle select all loaded items"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  {checkedIds.size === products.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}

              {checkedIds.size > 0 ? (
                <Button
                  size="sm"
                  onClick={addCheckedToCatalog}
                  className="h-9 text-xs font-semibold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Selected ({checkedIds.size})
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addAllLoadedToCatalog}
                  disabled={products.length === 0}
                  className="h-9 text-xs font-medium shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-primary" /> Add All ({products.length})
                </Button>
              )}
            </div>
          </div>

          {/* Active Category Badges */}
          {selectedCategories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Filtered by:</span>
              {selectedCategories.map((c) => (
                <Badge
                  key={c.id}
                  variant="secondary"
                  className="gap-1 text-xs py-0.5 px-2 bg-primary/10 text-primary border-primary/20"
                >
                  <span>{c.name}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:opacity-75"
                    onClick={() => toggleCategorySelection(c)}
                  />
                </Badge>
              ))}
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* 5-Column Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {products.map((p) => {
              const idVal = p.did || p.id;
              const isStaged = stagedMap.has(idVal);
              const isChecked = checkedIds.has(idVal);

              return (
                <div
                  key={idVal}
                  className={`rounded-xl border bg-card p-3 flex flex-col justify-between transition-all duration-150 hover:shadow-md relative group ${
                    isStaged
                      ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {/* Card Header: Checkbox & Staged Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => toggleCheckProduct(idVal)}
                      className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                      title="Select for bulk add"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>

                    {isStaged && (
                      <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0 h-4 shadow-2xs">
                        In Feed
                      </Badge>
                    )}
                  </div>

                  {/* 200x200 Square Thumbnail */}
                  <div className="w-full aspect-square rounded-lg bg-muted/40 overflow-hidden mb-2.5 border flex items-center justify-center relative">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category Tag */}
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block truncate">
                        {p.primaryCategory}
                      </span>

                      {/* Product Name */}
                      <h4
                        className="text-xs font-semibold text-foreground line-clamp-2 mt-0.5 leading-tight"
                        title={p.name}
                      >
                        {p.name}
                      </h4>
                    </div>

                    {/* Price & Variants */}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {p.hasPriceRange
                            ? `৳${p.price.toFixed(0)} - ৳${p.maxPrice.toFixed(0)}`
                            : `৳${p.price.toFixed(0)}`}
                        </span>
                        {p.hasVariants && (
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {p.variants.length} sizes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Add / Remove Button */}
                  <div className="pt-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => toggleStageProduct(p)}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isStaged
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-destructive/15 hover:text-destructive border border-emerald-500/30'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs'
                      }`}
                    >
                      {isStaged ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> In Feed
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add to Feed
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="rounded-xl border p-3 space-y-3 bg-card">
                  <Skeleton className="w-full aspect-square rounded-lg" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-full rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && products.length === 0 && (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground space-y-2">
              <ShoppingBag className="h-10 w-10 mx-auto opacity-40" />
              <p className="text-sm font-semibold text-foreground">No products found</p>
              <p className="text-xs">Try resetting your search or category filters.</p>
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-muted-foreground">
            {!hasMore && products.length > 0 && (
              <span className="text-muted-foreground/60">✓ All {totalProducts} products loaded</span>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STAGED FEED PRODUCTS */}
      {activeTab === 'staged' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              These {stagedMap.size} products ({catalogRows.length} total rows with variants) will be in your exported Meta CSV.
            </span>
            <Button
              size="sm"
              onClick={handleDownloadCsv}
              disabled={stagedMap.size === 0}
              className="h-8 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Download Meta CSV
            </Button>
          </div>

          {stagedMap.size === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center space-y-3">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold text-sm">No products in catalog feed yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Go to the <strong>Browse Inventory</strong> tab, pick your categories, and click <strong>Add to Feed</strong>.
              </p>
              <Button size="sm" onClick={() => setActiveTab('browse')}>
                Browse Inventory
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b text-muted-foreground font-medium">
                      <th className="p-3 w-10 text-center">Remove</th>
                      <th className="p-3 min-w-[220px]">Product Title</th>
                      <th className="p-3 min-w-[120px]">Category</th>
                      <th className="p-3 min-w-[120px]">Content ID</th>
                      <th className="p-3 min-w-[120px]">Feed Price</th>
                      <th className="p-3 min-w-[100px]">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Array.from(stagedMap.values()).map((p) => {
                      const idVal = p.did || p.id;
                      return (
                        <tr key={idVal} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStagedItem(idVal)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                              title="Remove from feed"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-md border bg-muted/30 overflow-hidden shrink-0 flex items-center justify-center">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                                )}
                              </div>
                              <span className="font-medium text-foreground truncate max-w-[280px]">
                                {p.name}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-muted-foreground">
                            {p.primaryCategory}
                          </td>

                          <td className="p-3 font-mono text-[11px] text-muted-foreground">
                            {idMapping === 'sku' ? p.sku : idMapping === 'id' ? p.id : idMapping === 'slug' ? p.slug : p.did}
                          </td>

                          <td className="p-3 font-mono font-semibold">
                            {p.hasPriceRange
                              ? `৳${p.price.toFixed(0)} - ৳${p.maxPrice.toFixed(0)}`
                              : `৳${p.price.toFixed(0)}`}
                          </td>

                          <td className="p-3">
                            {p.hasVariants ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                                {p.variants.length} Variants
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Simple Item
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: META CSV RAW PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-xl border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">
                Previewing Links:
              </span>
              <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border shadow-2xs">
                {configuredSites.map((site) => (
                  <button
                    key={site.key}
                    type="button"
                    onClick={() => setActiveSiteKey(site.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      activeSiteKey === site.key
                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {site.name}
                  </button>
                ))}
              </div>
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20">
                Pixel: {activeSite.pixelId}
              </Badge>
              <span className="text-[11px] text-muted-foreground hidden md:inline font-mono">
                ({activeSite.url})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => handleDownloadSiteCsv(storeSite)}
                disabled={catalogRows.length === 0}
                className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Store CSV ({catalogRows.length})
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownloadSiteCsv(shopSite)}
                disabled={catalogRows.length === 0}
                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Shop CSV ({catalogRows.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadSiteXlsx(activeSite)}
                disabled={catalogRows.length === 0}
                className="h-8 text-xs cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                {activeSite.key === 'shop' ? 'Shop' : 'Store'} Excel (.xlsx)
              </Button>
            </div>
          </div>

          {catalogRows.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground text-xs">
              No products selected. Please add products from the Browse tab.
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden font-mono text-[11px]">
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/80 sticky top-0 z-10 border-b shadow-2xs">
                    <tr>
                      {['id', 'title', 'availability', 'price', 'sale_price', 'brand', 'product_type', 'link', 'image_link'].map(
                        (col) => (
                          <th
                            key={col}
                            className="p-2.5 font-semibold text-foreground border-r last:border-r-0 whitespace-nowrap"
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {catalogRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-2.5 border-r font-semibold text-primary">{row.id}</td>
                        <td className="p-2.5 border-r truncate max-w-[200px]" title={row.title}>
                          {row.title}
                        </td>
                        <td className="p-2.5 border-r">
                          <span
                            className={
                              row.availability === 'in stock'
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-destructive font-semibold'
                            }
                          >
                            {row.availability}
                          </span>
                        </td>
                        <td className="p-2.5 border-r">{row.price}</td>
                        <td className="p-2.5 border-r text-emerald-600 dark:text-emerald-400 font-semibold">
                          {row.sale_price || '—'}
                        </td>
                        <td className="p-2.5 border-r">{row.brand}</td>
                        <td className="p-2.5 border-r text-muted-foreground">{row.product_type}</td>
                        <td className="p-2.5 border-r truncate max-w-[180px]" title={row.link}>
                          {row.link}
                        </td>
                        <td className="p-2.5 truncate max-w-[180px]" title={row.image_link}>
                          {row.image_link}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FEED CONFIGURATION SETTINGS MODAL */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <span>Meta Catalog Feed Settings</span>
            </DialogTitle>
            <DialogDescription>
              Configure store URLs, ID mapping, and Meta Commerce parameters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Live Scheduled Feed URLs for Meta Commerce Manager */}
            <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Meta Commerce Scheduled Feeds
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Dual-Site Feeds
                </Badge>
              </div>

              {/* Store Live Feed */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span>1. Surokkha Store Feed (surokkha.store)</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Pixel: {storeSite.pixelId || 'not set'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={`${imageBaseUrl.replace(/\/$/, '')}/api/v1/products/feed/meta-catalog.csv?site=store`}
                    className="h-7 text-[11px] font-mono bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 shrink-0 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(`${imageBaseUrl.replace(/\/$/, '')}/api/v1/products/feed/meta-catalog.csv?site=store`);
                      toast.success('Store Feed URL copied to clipboard!');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>

              {/* Shop Live Feed */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <span>2. Surokkha Shop Feed (surokkha.shop)</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Pixel: {shopSite.pixelId || 'not set'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={`${imageBaseUrl.replace(/\/$/, '')}/api/v1/products/feed/meta-catalog.csv?site=shop`}
                    className="h-7 text-[11px] font-mono bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 shrink-0 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(`${imageBaseUrl.replace(/\/$/, '')}/api/v1/products/feed/meta-catalog.csv?site=shop`);
                      toast.success('Shop Feed URL copied to clipboard!');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                Tip: In Meta Commerce Manager &gt; Data Sources &gt; Data Feeds &gt; Scheduled Feed, paste the respective URL to sync products automatically.
              </p>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">
                Store Website URL
              </label>
              <Input
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">
                Product URL Path Prefix
              </label>
              <Input
                value={productPathPrefix}
                onChange={(e) => setProductPathPrefix(e.target.value)}
                placeholder="/products/"
                className="h-8 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Resulting link: <code>{siteUrl.replace(/\/$/, '')}{productPathPrefix.startsWith('/') ? productPathPrefix : `/${productPathPrefix}`}:slug</code>
              </span>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">
                Image Server Base URL
              </label>
              <Input
                value={imageBaseUrl}
                onChange={(e) => setImageBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground block mb-1">
                  Meta Content ID Mapping
                </label>
                <select
                  value={idMapping}
                  onChange={(e) => setIdMapping(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary outline-hidden"
                >
                  <option value="did">product.did (Recommended for Meta Pixel)</option>
                  <option value="sku">product.sku</option>
                  <option value="id">product.id (MongoDB ObjectID)</option>
                  <option value="slug">product.slug (URL Path)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">
                  Currency Code
                </label>
                <Input
                  value="BDT (Bangladeshi Taka)"
                  disabled
                  className="h-8 text-xs bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground block mb-1">
                  Default Condition
                </label>
                <select
                  value={defaultCondition}
                  onChange={(e) => setDefaultCondition(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary outline-hidden"
                >
                  <option value="new">new</option>
                  <option value="refurbished">refurbished</option>
                  <option value="used">used</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">
                  Google / FB Category (Optional)
                </label>
                <Input
                  value={googleCategory}
                  onChange={(e) => setGoogleCategory(e.target.value)}
                  placeholder="e.g. Health & Beauty > Perfumes"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">
                Custom Label 0 (Optional Ad Set Tag)
              </label>
              <Input
                value={customLabel0}
                onChange={(e) => setCustomLabel0(e.target.value)}
                placeholder="e.g. Best Sellers / Meta Ads Collection"
                className="h-8 text-xs"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-3 border-t">
              <input
                type="checkbox"
                id="incVarModal"
                checked={includeVariants}
                onChange={(e) => setIncludeVariants(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <div>
                <label htmlFor="incVarModal" className="cursor-pointer font-medium select-none text-xs block">
                  Export each variation as separate product row
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Default: off (recommended). Variable products are exported as 1 single product entry matching Meta Pixel IDs. Enable only if you want individual rows for every variant with <code>item_group_id</code>.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setSettingsOpen(false)}>
              Done & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MetaCatalogGenerator;
