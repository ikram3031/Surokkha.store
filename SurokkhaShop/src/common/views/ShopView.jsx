import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, buildShopCategories, productCategorySlugs } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import PromoComboBanner from '../components/PromoComboBanner';
import TestimonialCarousel from '../components/TestimonialCarousel';

export default function ShopView() {
  const navigateTo = useStore((state) => state.navigateTo);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);
  const storeCategories = useStore((state) => state.categories);

  const { t, isBn, formatNumber } = useTranslation();

  // 1. Dynamic category filter ('all' or specific slug like 'combo', 'contraceptive', 'lubricant', etc.)
  const shopCategory = useStore((state) => state.shopCategory);
  const [category, setCategory] = useState(shopCategory || 'all');
  // Follow category picks from the menu while the shop page is already open
  useEffect(() => { setCategory(shopCategory || 'all'); }, [shopCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  // Price slider: [min, max] in taka; null means "no limit" on that side
  const [priceSel, setPriceSel] = useState([null, null]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  // 2. Default sorting: Newest first (latest products at top)
  const [sortBy, setSortBy] = useState('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const PAGE_SIZE = 8; // two rows of four on desktop
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Base list of active (and optionally in-stock) products
  const activeProducts = useMemo(() => {
    return productKeys.map((k) => products[k]).filter((p) => {
      if (!p) return false;
      if (p.isActive === false || p.status === 'inactive') return false;
      if (inStockOnly && p.isOutOfStock) return false;
      return true;
    });
  }, [productKeys, products, inStockOnly]);

  const totalActiveCount = activeProducts.length;

  // Real dashboard categories that have products; a parent (e.g. Personal Care) also counts its sub-categories
  const dynamicCategories = useMemo(
    () => buildShopCategories(storeCategories || [], activeProducts),
    [storeCategories, activeProducts]
  );

  // Selling price used by the price filter
  const sellingPrice = (p) => {
    if (!p) return 0;
    const reg = Number(p.price != null ? p.price : (p.regularPrice || 0));
    const offer = Number(p.offerPrice);
    return offer > 0 && offer < reg ? offer : reg;
  };

  // Slider bounds come from the catalog's cheapest and dearest products
  const priceBounds = useMemo(() => {
    const prices = activeProducts.map(sellingPrice).filter((n) => n > 0);
    if (!prices.length) return [0, 0];
    return [Math.floor(Math.min(...prices) / 10) * 10, Math.ceil(Math.max(...prices) / 10) * 10];
  }, [activeProducts]);
  const minPrice = priceSel[0] ?? undefined;
  const maxPrice = priceSel[1] ?? undefined;
  const priceFiltered = priceSel[0] != null || priceSel[1] != null;

  // Brands with product counts (a product can list several brands, e.g. the Trial Pack)
  const brandsOf = (p) => {
    const names = Array.isArray(p?.brandNames) && p.brandNames.length ? p.brandNames : [p?.brandName || p?.brand].filter(Boolean);
    return names.filter((n) => typeof n === 'string' && !/^[0-9a-f]{12,}$/i.test(n.trim())).map((n) => n.trim());
  };
  const brandOptions = useMemo(() => {
    const counts = {};
    activeProducts.forEach((p) => brandsOf(p).forEach((b) => { counts[b] = (counts[b] || 0) + 1; }));
    return Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([name, count]) => ({ name, count }));
  }, [activeProducts]);
  const toggleBrand = (name) => setSelectedBrands((prev) => (prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]));

  // Filter and sort products pipeline
  const displayedKeys = useMemo(() => {
    const cleanQuery = String(searchQuery || '').trim().toLowerCase();

    let list = productKeys.filter((k) => {
      const prod = products[k];
      if (!prod) return false;
      if (prod.isActive === false || prod.status === 'inactive') return false;

      // Search Filter
      if (cleanQuery) {
        const nameEn = String(prod?.name || prod?.title || '').toLowerCase();
        const nameBn = String(prod?.name_bn || prod?.title_bn || '').toLowerCase();
        const descEn = String(prod?.description || prod?.longDescription || '').toLowerCase();
        const descBn = String(prod?.description_bn || prod?.longDescription_bn || '').toLowerCase();
        const catName = String(typeof prod?.category === 'object' ? prod?.category?.name : prod?.category || '').toLowerCase();
        const catBn = String(prod?.category_bn || '').toLowerCase();
        const brand = String(prod?.brand || '').toLowerCase();
        const slug = String(prod?.slug || k).toLowerCase();

        const matches =
          slug.includes(cleanQuery) ||
          nameEn.includes(cleanQuery) ||
          nameBn.includes(cleanQuery) ||
          descEn.includes(cleanQuery) ||
          descBn.includes(cleanQuery) ||
          catName.includes(cleanQuery) ||
          catBn.includes(cleanQuery) ||
          brand.includes(cleanQuery);

        if (!matches) return false;
      }

      // Category filter
      if (category !== 'all' && !productCategorySlugs(prod, storeCategories || []).has(category)) return false;

      // Price filter helper to get effective selling price
      const getSellingPrice = (p) => {
        if (!p) return 0;
        const reg = Number(p.price != null ? p.price : (p.regularPrice || 0));
        if (p.offerPrice != null && !isNaN(Number(p.offerPrice)) && Number(p.offerPrice) > 0 && Number(p.offerPrice) < reg) {
          return Number(p.offerPrice);
        }
        return reg;
      };

      const price = getSellingPrice(prod);
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;

      // Brand filter
      if (selectedBrands.length && !brandsOf(prod).some((b) => selectedBrands.includes(b))) return false;

      // In stock check
      if (inStockOnly && prod.isOutOfStock) return false;

      return true;
    });
    // Sorting (Default: Newest first, latest products at top)
    // Sorting (Default: Oldest to Newest, original lineup at top, new arrivals at bottom)
    list.sort((a, b) => {
      const pA = products[a];
      const pB = products[b];
      const getSellingPrice = (p) => {
        if (!p) return 0;
        const reg = Number(p.price != null ? p.price : (p.regularPrice || 0));
        if (p.offerPrice != null && !isNaN(Number(p.offerPrice)) && Number(p.offerPrice) > 0 && Number(p.offerPrice) < reg) {
          return Number(p.offerPrice);
        }
        return reg;
      };
      const priceA = getSellingPrice(pA);
      const priceB = getSellingPrice(pB);
      const timeA = pA?.createdTimestamp || (pA?.createdAt ? new Date(pA.createdAt).getTime() : 0);
      const timeB = pB?.createdTimestamp || (pB?.createdAt ? new Date(pB.createdAt).getTime() : 0);

      switch (sortBy) {
        case 'oldest':
          if (!timeA && timeB) return -1;
          if (timeA && !timeB) return 1;
          return (timeA || 0) - (timeB || 0); // Oldest first
        case 'newest':
          return (timeB || 0) - (timeA || 0); // Newest first
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'popular':
        default:
          return 0; // productKeys already arrive most-ordered first
      }
    });

    return list;
  }, [productKeys, products, category, searchQuery, minPrice, maxPrice, inStockOnly, sortBy, selectedBrands, storeCategories]);

  const paginatedKeys = displayedKeys.slice(0, displayCount);
  const hasMore = displayCount < displayedKeys.length;

  // Start again from the first rows whenever the filters change
  useEffect(() => { setDisplayCount(PAGE_SIZE); }, [category, searchQuery, minPrice, maxPrice, inStockOnly, sortBy, selectedBrands]);

  // Infinite scroll: load the next rows when the sentinel below the grid comes into view
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setDisplayCount((prev) => prev + PAGE_SIZE);
    }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, displayCount]);

  const handleResetFilters = () => {
    setCategory('all');
    setSearchQuery('');
    setPriceSel([null, null]);
    setSelectedBrands([]);
    setSortBy('newest');
    setInStockOnly(false);
    setDisplayCount(PAGE_SIZE);
  };

  return (
    <div className="bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 min-h-screen pb-16">

      {/* 1. Header Banner - EXACTLY PRESERVED AS PER SCREENSHOT RULE */}
      <div className="bg-gradient-to-r from-[#200b14] via-[#15050d] to-[#200b14] text-white py-12 sm:py-16 border-b border-rose-950/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-rose-200/70 mb-4">
            <button onClick={() => navigateTo('home')} className="hover:text-amber-400 transition cursor-pointer">
              {t('product_detail.breadcrumb_home', 'হোম')}
            </button>
            <span>/</span>
            <span className="text-amber-400 font-semibold">{isBn ? 'শপ ও সকল কালেকশন' : 'Shop All Products'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-white tracking-tight">
            {isBn ? 'সকল প্রোডাক্ট ও কম্বো প্যাক' : 'All Products & Combos'}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto mt-3 leading-relaxed">
            {isBn
              ? 'MO, Durex, Skore সহ বিশ্বস্ত ব্র্যান্ডের ১০০% আসল প্রোডাক্ট ও কম্বো প্যাক। গোপনীয় প্যাকেজিং, সারা দেশে ক্যাশ অন ডেলিভারি।'
              : '100% genuine products and combo packs from trusted brands like MO, Durex and Skore. Discreet packaging, cash on delivery nationwide.'}
          </p>

        </div>
      </div>

      {/* 2. Main Content Layout (SoulCove Structure: Toolbar + 4-column Grid with Dynamic Sidebar & Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Clean Toolbar: Dynamic Product Count from API, Search Input & Sort Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-rose-200/70 gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-slate-800 font-semibold whitespace-nowrap">
              {isBn ? 'প্রদর্শিত হচ্ছে' : 'Showing'}{' '}
              <strong className="text-slate-900 font-bold">{formatNumber(displayedKeys.length)}</strong>{' '}
              {isBn ? 'টি প্রোডাক্ট' : 'products'}
            </span>
          </div>

          {/* Search Box in Toolbar */}
          <div className="flex-1 max-w-md mx-0 md:mx-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'নাম বা ক্যাটাগরি দিয়ে সার্চ করুন...' : 'Search products or items...'}
                className="w-full bg-white border border-rose-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear Search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-0.5 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-rose-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>{isBn ? 'ফিল্টার' : 'Filters'}</span>
            </button>

            {/* Sort Dropdown (Default: Old to New) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-800 font-semibold hidden sm:inline whitespace-nowrap">
                {isBn ? 'সাজান:' : 'Sort:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 text-xs bg-white border border-rose-200 rounded-xl px-3 text-slate-800 font-semibold shadow-2xs focus:outline-none focus:border-brand-600 cursor-pointer"
              >
                <option value="popular">{isBn ? 'জনপ্রিয়তা অনুযায়ী (ডিফল্ট)' : 'Most Popular (Default)'}</option>
                <option value="newest">{isBn ? 'নতুন পণ্য প্রথমে' : 'Newest First'}</option>
                <option value="oldest">{isBn ? 'আগের পণ্য প্রথমে' : 'Oldest First'}</option>
                <option value="price-asc">{isBn ? 'দাম: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price-desc">{isBn ? 'দাম: বেশি থেকে কম' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid Layout: Sidebar Filters + Products (SoulCove grid-cols-1 lg:grid-cols-4) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Desktop Sidebar Filters (SoulCove Dynamic Sidebar Structure) */}
          <aside
            className={`lg:block ${mobileFilterOpen
                ? 'fixed inset-0 z-50 bg-[#FAF8F5] p-6 overflow-y-auto block'
                : 'hidden lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto'
              } lg:relative lg:p-0 space-y-6`}
          >
            {mobileFilterOpen && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 lg:hidden">
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  {isBn ? 'ফিল্টার' : 'Filters'}
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
                >
                  {isBn ? 'প্রয়োগ' : 'Apply'}
                </button>
              </div>
            )}

            {/* Reset Filters CTA */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isBn ? 'সকল ফিল্টার রিসেট' : 'Reset All Filters'}</span>
            </button>

            {/* Dynamic Categories Box (Populated from API Products & Categories) */}
            <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-900 flex items-center justify-between">
                <span>{isBn ? 'ক্যাটাগরি' : 'Categories'}</span>
                {category !== 'all' && (
                  <button
                    onClick={() => setCategory('all')}
                    className="text-[11px] text-brand-700 font-medium lowercase hover:underline cursor-pointer"
                  >
                    {isBn ? 'মুছুন' : 'clear'}
                  </button>
                )}
              </h3>

              <div className="space-y-1 text-xs">
                {/* All Products Option */}
                <button
                  type="button"
                  onClick={() => setCategory('all')}
                  className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${category === 'all'
                      ? 'bg-rose-50 font-semibold text-brand-900 border border-rose-200'
                      : 'text-slate-800 hover:bg-slate-50'
                    }`}
                >
                  <span>{isBn ? 'সকল প্রোডাক্ট' : 'All Products'}</span>
                  <span>{formatNumber(totalActiveCount)}</span>
                </button>

                {/* Dynamically Loaded Categories */}
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setCategory(cat.slug)}
                    className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${category === cat.slug
                        ? 'bg-rose-50 font-semibold text-brand-900 border border-rose-200'
                        : 'text-slate-800 hover:bg-slate-50'
                      }`}
                  >
                    <span className={cat.depth ? 'pl-3' : ''}>{cat.depth ? '└ ' : ''}{isBn ? cat.name_bn : cat.name}</span>
                    <span>{formatNumber(cat.count)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle */}
            <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="stock-filter"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 accent-rose-600 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {isBn ? 'শুধুমাত্র স্টকে থাকা প্রোডাক্ট' : 'In Stock Items Only'}
                </span>
              </label>
            </div>

            {/* Price Range Slider */}
            {priceBounds[1] > priceBounds[0] && (() => {
              const [lo, hi] = priceBounds;
              const curMin = priceSel[0] ?? lo;
              const curMax = priceSel[1] ?? hi;
              const pct = (v) => ((v - lo) / (hi - lo)) * 100;
              const setMin = (v) => setPriceSel([v <= lo ? null : Math.min(v, curMax - 10), priceSel[1]]);
              const setMax = (v) => setPriceSel([priceSel[0], v >= hi ? null : Math.max(v, curMin + 10)]);
              return (
                <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs space-y-4">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-black flex items-center justify-between">
                    <span>{isBn ? 'মূল্য সীমা' : 'Price'}</span>
                    {priceFiltered && (
                      <button onClick={() => setPriceSel([null, null])} className="text-[11px] text-brand-700 font-medium lowercase hover:underline cursor-pointer">
                        {isBn ? 'মুছুন' : 'clear'}
                      </button>
                    )}
                  </h3>
                  <div className="price-range relative h-5">
                    <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full rounded-full bg-rose-100" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-rose-600"
                      style={{ left: `${pct(curMin)}%`, right: `${100 - pct(curMax)}%` }}
                    />
                    <input type="range" min={lo} max={hi} step={10} value={curMin} aria-label="Minimum price"
                      onChange={(e) => setMin(Number(e.target.value))} />
                    <input type="range" min={lo} max={hi} step={10} value={curMax} aria-label="Maximum price"
                      onChange={(e) => setMax(Number(e.target.value))} />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-black">
                    <span className="rounded-lg border border-rose-200 px-2.5 py-1">৳{formatNumber(curMin)}</span>
                    <span className="rounded-lg border border-rose-200 px-2.5 py-1">৳{formatNumber(curMax)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Brand Filter */}
            {brandOptions.length > 0 && (
              <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-black flex items-center justify-between">
                  <span>{isBn ? 'ব্র্যান্ড' : 'Brand'}</span>
                  {selectedBrands.length > 0 && (
                    <button onClick={() => setSelectedBrands([])} className="text-[11px] text-brand-700 font-medium lowercase hover:underline cursor-pointer">
                      {isBn ? 'মুছুন' : 'clear'}
                    </button>
                  )}
                </h3>
                <div className="space-y-1 text-xs">
                  {brandOptions.map((b) => (
                    <label key={b.name} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-rose-50 cursor-pointer select-none">
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(b.name)}
                          onChange={() => toggleBrand(b.name)}
                          className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                        />
                        <span className="font-semibold text-black">{b.name}</span>
                      </span>
                      <span className="text-black">{formatNumber(b.count)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Product Grid Area (SoulCove lg:col-span-3) */}
          <div className="lg:col-span-3">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : displayedKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-white border border-rose-200/60 shadow-2xs">
                <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-slate-400 mb-4 text-3xl">
                  📦
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  {isBn ? 'কোনো প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}
                </h3>
                <p className="mt-1 text-xs text-slate-800 max-w-sm">
                  {isBn
                    ? 'আপনার নির্বাচিত ফিল্টারে কোনো আইটেম পাওয়া যায়নি। ফিল্টার রিসেট করে আবার দেখুন।'
                    : "We couldn't find items matching your current filters. Try resetting your price or category options."}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-700 to-rose-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs cursor-pointer"
                >
                  <span>✨</span>
                  <span>{isBn ? 'সকল প্রোডাক্ট ব্রাউজ করুন' : 'Browse All Products'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Product Cards Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                  {paginatedKeys.map((key) => (
                    <ProductCard key={key} productKey={key} />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                {hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-6" aria-hidden="true">
                    <span className="h-6 w-6 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Special 3-Pack Combo Promo Banner */}
      <PromoComboBanner />

      {/* Testimonials */}
      <div className="mt-10">
        <TestimonialCarousel />
      </div>

    </div>
  );
}


