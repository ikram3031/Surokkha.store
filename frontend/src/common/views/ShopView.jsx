import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
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
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under-500' | '500-800' | 'above-800'

  // 2. Default sorting: Oldest to Newest (original products at top, new ones go down)
  const [sortBy, setSortBy] = useState('oldest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [displayCount, setDisplayCount] = useState(24);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Normalization helper for category slugs (handles singular, plural, and variations)
  const normalizeCatSlug = (slug, name = '') => {
    const s = String(slug || name || '').toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, '-');
    if (s.includes('contraceptive') || s.includes('condom') || s.includes('কনট্রাসেপটিভ') || s.includes('কনডম')) return 'contraceptive';
    if (s.includes('combo') || s.includes('কম্বো')) return 'combo';
    if (s.includes('lubricant') || s.includes('jelly') || s.includes('gel') || s.includes('লুব্রিকেন্ট')) return 'lubricant';
    if (s.includes('booster') || s.includes('spray') || s.includes('delay') || s.includes('performance') || s.includes('বুস্টার')) return 'performance-booster';
    return s || 'other';
  };

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

  const contraceptiveCount = useMemo(() => {
    return activeProducts.filter((p) => {
      const isCombo = (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo'));
      if (isCombo) return false;
      return normalizeCatSlug(p.categorySlug, (typeof p.category === 'object' ? p.category?.name : p.category) || p.slug) === 'contraceptive';
    }).length;
  }, [activeProducts]);

  const comboCount = useMemo(() => {
    return activeProducts.filter((p) => {
      return (
        normalizeCatSlug(p.categorySlug, (typeof p.category === 'object' ? p.category?.name : p.category) || p.slug) === 'combo' ||
        (p.slug && p.slug.includes('combo')) ||
        (p.name && p.name.toLowerCase().includes('combo'))
      );
    }).length;
  }, [activeProducts]);

  const lubricantCount = useMemo(() => {
    return activeProducts.filter((p) => {
      return normalizeCatSlug(p.categorySlug, (typeof p.category === 'object' ? p.category?.name : p.category) || p.slug) === 'lubricant';
    }).length;
  }, [activeProducts]);

  const boosterCount = useMemo(() => {
    return activeProducts.filter((p) => {
      return normalizeCatSlug(p.categorySlug, (typeof p.category === 'object' ? p.category?.name : p.category) || p.slug) === 'performance-booster';
    }).length;
  }, [activeProducts]);

  // Dynamic Category Extraction from products & categories (including any custom store categories)
  const dynamicCategories = useMemo(() => {
    const list = [
      { slug: 'contraceptive', name: 'Contraceptive', name_bn: 'কনট্রাসেপটিভ', count: contraceptiveCount },
      { slug: 'combo', name: 'Combo', name_bn: 'কম্বো', count: comboCount },
      { slug: 'lubricant', name: 'Lubricants', name_bn: 'লুব্রিকেন্ট', count: lubricantCount },
      { slug: 'performance-booster', name: 'Performance Booster', name_bn: 'পারফরম্যান্স বুস্টার', count: boosterCount },
    ];

    // Also include any extra custom categories found in active products
    const knownSlugs = new Set(list.map((c) => c.slug));
    const extraMap = {};
    activeProducts.forEach((p) => {
      const rawCatName = (typeof p.category === 'object' ? p.category?.name : p.category) || '';
      const rawCatBn = (typeof p.category === 'object' && p.category?.name_bn) ? p.category.name_bn : (p.category_bn || rawCatName);
      const norm = normalizeCatSlug(p.categorySlug, rawCatName || p.slug);
      if (!knownSlugs.has(norm) && norm !== 'other' && norm) {
        if (!extraMap[norm]) {
          extraMap[norm] = {
            slug: norm,
            name: rawCatName || norm,
            name_bn: rawCatBn || rawCatName || norm,
            count: 0,
          };
        }
        extraMap[norm].count += 1;
      }
    });

    Object.values(extraMap).forEach((extraCat) => {
      list.push(extraCat);
    });

    return list.filter((c) => c.count > 0);
  }, [contraceptiveCount, comboCount, lubricantCount, boosterCount, activeProducts]);

  // Dynamic counts for banner tabs
  const singleCount = contraceptiveCount;

  // Derived Min/Max prices from priceRange filter
  const minPrice = useMemo(() => {
    if (priceRange === 'under-500') return 0;
    if (priceRange === '500-800') return 500;
    if (priceRange === 'above-800') return 800;
    return undefined;
  }, [priceRange]);

  const maxPrice = useMemo(() => {
    if (priceRange === 'under-500') return 500;
    if (priceRange === '500-800') return 800;
    if (priceRange === 'above-800') return undefined;
    return undefined;
  }, [priceRange]);

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

      const isCombo = k.toLowerCase().includes('combo') || (prod?.name && prod.name.toLowerCase().includes('combo')) || prod?.category === 'Combo' || prod?.category === 'Combo Pack' || (prod?.category_bn && prod.category_bn.includes('কম্বো')) || (prod?.categorySlug && prod.categorySlug.includes('combo'));

      // Category filter
      if (category !== 'all') {
        if (category === 'single') {
          if (isCombo) return false;
        } else if (category === 'combo') {
          if (!isCombo) return false;
        } else {
          const prodCatNorm = normalizeCatSlug(prod.categorySlug, (typeof prod.category === 'object' ? prod.category?.name : prod.category) || k);
          const targetCatNorm = normalizeCatSlug(category);
          if (targetCatNorm === 'contraceptive' && isCombo) return false;
          if (prodCatNorm !== targetCatNorm) return false;
        }
      }

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

      // In stock check
      if (inStockOnly && prod.isOutOfStock) return false;

      return true;
    });

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
        case 'featured':
        default:
          return 0;
      }
    });

    return list;
  }, [productKeys, products, category, searchQuery, minPrice, maxPrice, inStockOnly, sortBy]);

  const paginatedKeys = displayedKeys.slice(0, displayCount);
  const hasMore = displayCount < displayedKeys.length;

  const handleResetFilters = () => {
    setCategory('all');
    setSearchQuery('');
    setPriceRange('all');
    setSortBy('oldest');
    setInStockOnly(false);
    setDisplayCount(24);
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
              ? 'আইএসও সার্টিফাইড আসল MO কন্ট্রাসেপ্টিভ ভ্যারিয়েন্ট ও পরিবার পরিকল্পনা কম্বো বান্ডেল। ১৮+ প্রাপ্তবয়স্কদের জন্য ক্যাশ অন ডেলিভারিতে।'
              : '  certified authentic MO contraceptive variants and family planning bundles. Regulated barrier devices for 18+ adults with confidential Cash on Delivery nationwide.'}
          </p>

          {/* Category Filter Tabs: Exclusively 2 options (All Products and Combo) */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-8 flex-wrap">
            {/* All Products Tab */}
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${category === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black border border-amber-300'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-xs'
                }`}
            >
              🌟 {isBn ? 'সকল প্রোডাক্ট' : 'All Products'} ({formatNumber(totalActiveCount)})
            </button>

            {/* Combo Tab */}
            <button
              type="button"
              onClick={() => setCategory(category === 'combo' ? 'all' : 'combo')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${category === 'combo'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black border border-amber-300'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-xs'
                }`}
            >
              🔥 {isBn ? 'কম্বো' : 'Combos'} ({formatNumber(comboCount)})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Layout (SoulCove Structure: Toolbar + 4-column Grid with Dynamic Sidebar & Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Clean Toolbar: Dynamic Product Count from API, Search Input & Sort Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-rose-200/70 gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-slate-600 font-semibold whitespace-nowrap">
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
              <span className="text-xs text-slate-500 font-semibold hidden sm:inline whitespace-nowrap">
                {isBn ? 'সাজান:' : 'Sort:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 text-xs bg-white border border-rose-200 rounded-xl px-3 text-slate-800 font-semibold shadow-2xs focus:outline-none focus:border-brand-600 cursor-pointer"
              >
                <option value="oldest">{isBn ? 'আগের পণ্য প্রথমে (ডিফল্ট)' : 'Oldest First (Default)'}</option>
                <option value="newest">{isBn ? 'নতুন কালেকশন' : 'Newest Drops'}</option>
                <option value="price-asc">{isBn ? 'দাম: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price-desc">{isBn ? 'দাম: বেশি থেকে কম' : 'Price: High to Low'}</option>
                <option value="featured">{isBn ? 'জনপ্রিয়তা অনুযায়ী' : 'Featured'}</option>
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
                : 'hidden'
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
                      : 'text-slate-600 hover:bg-slate-50'
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
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{isBn ? cat.name_bn : cat.name}</span>
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

            {/* Price Range Filter Box */}
            <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-900 flex items-center justify-between">
                <span>{isBn ? 'মূল্য সীমা' : 'Price'}</span>
                {priceRange !== 'all' && (
                  <button
                    onClick={() => setPriceRange('all')}
                    className="text-[11px] text-brand-700 font-medium lowercase hover:underline cursor-pointer"
                  >
                    {isBn ? 'মুছুন' : 'clear'}
                  </button>
                )}
              </h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'all', label: isBn ? 'সকল দাম' : 'All Prices' },
                  { id: 'under-500', label: isBn ? '৳৫০০ এর নিচে' : 'Under ৳500' },
                  { id: '500-800', label: isBn ? '৳৫০০ — ৳৮০০' : '৳500 — ৳800' },
                  { id: 'above-800', label: isBn ? '৳৮০০ ও বেশি' : '৳800 & Above' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setPriceRange(tier.id)}
                    className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${priceRange === tier.id
                        ? 'bg-rose-50 font-semibold text-brand-900 border border-rose-200'
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters CTA */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-200 text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 hover:text-brand-800 transition-colors shadow-2xs cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isBn ? 'সকল ফিল্টার রিসেট' : 'Reset All Filters'}</span>
            </button>
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
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
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

                {/* Load More Button Module */}
                {hasMore && (
                  <div className="flex flex-col items-center justify-center pt-4">
                    <p className="text-xs text-slate-500 mb-3 font-medium">
                      {isBn
                        ? `প্রদর্শিত হচ্ছে ${formatNumber(paginatedKeys.length)} / মোট ${formatNumber(displayedKeys.length)} টি প্রোডাক্ট`
                        : `Showing ${paginatedKeys.length} of ${displayedKeys.length} products`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDisplayCount((prev) => prev + 4)}
                      className="px-6 py-2.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-brand-800 text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      {isBn ? 'আরও প্রোডাক্ট দেখুন' : 'Load More Products'}
                    </button>
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


