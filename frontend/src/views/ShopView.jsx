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

  const { t, isBn, formatPrice } = useTranslation();

  // 1. Tab category filter: 'all' | 'single' | 'combo' (matches screenshot and SoulCove category logic)
  const [category, setCategory] = useState('all'); 
  const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under-500' | '500-800' | 'above-800'
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'newest' | 'price-asc' | 'price-desc'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [displayCount, setDisplayCount] = useState(8);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Category counts
  const singleCount = useMemo(() => {
    return productKeys.filter((k) => {
      const p = products[k];
      return !(k.toLowerCase().includes('combo') || p?.iconType === 'combo' || p?.category === 'Combo' || p?.category === 'Combo Pack');
    }).length;
  }, [productKeys, products]);

  const comboCount = useMemo(() => {
    return productKeys.filter((k) => {
      const p = products[k];
      return (k.toLowerCase().includes('combo') || p?.iconType === 'combo' || p?.category === 'Combo' || p?.category === 'Combo Pack');
    }).length;
  }, [productKeys, products]);

  // Derived Min/Max prices from priceRange filter (SoulCove pattern)
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

  // Filter and sort products (SoulCove logic)
  const displayedKeys = useMemo(() => {
    let list = productKeys.filter((k) => {
      const prod = products[k];
      if (!prod) return false;

      const isCombo = k.toLowerCase().includes('combo') || prod?.iconType === 'combo' || prod?.category === 'Combo' || prod?.category === 'Combo Pack';
      
      // Category / Pack filter
      if (category === 'single' && isCombo) return false;
      if (category === 'combo' && !isCombo) return false;

      // Price filter
      const price = Number(prod.price || prod.offerPrice || 0);
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;

      // In stock only filter
      const isOutOfStock = Boolean(prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0);
      if (inStockOnly && isOutOfStock) return false;

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      const pA = products[a];
      const pB = products[b];
      const priceA = Number(pA?.price || pA?.offerPrice || 0);
      const priceB = Number(pB?.price || pB?.offerPrice || 0);

      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'newest':
          return (pB?.createdTimestamp || 0) - (pA?.createdTimestamp || 0);
        case 'featured':
        default:
          return 0;
      }
    });

    return list;
  }, [productKeys, products, category, minPrice, maxPrice, inStockOnly, sortBy]);

  const paginatedKeys = displayedKeys.slice(0, displayCount);
  const hasMore = displayCount < displayedKeys.length;

  const handleResetFilters = () => {
    setCategory('all');
    setPriceRange('all');
    setSortBy('featured');
    setInStockOnly(false);
    setDisplayCount(8);
  };

  return (
    <div className="bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 min-h-screen pb-16">
      
      {/* 1. Header Banner - EXACTLY PRESERVED AS PER SCREENSHOT RULE */}
      <div className="bg-gradient-to-r from-[#200b14] via-[#15050d] to-[#200b14] text-white py-12 sm:py-16 border-b border-rose-950/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
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
              : 'ISO 4074 certified authentic MO contraceptive variants and family planning bundles. Regulated barrier devices for 18+ adults with confidential Cash on Delivery nationwide.'}
          </p>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-8 flex-wrap">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                category === 'all'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {isBn ? 'সকল প্রোডাক্ট' : 'All Products'} ({productKeys.length})
            </button>

            <button
              type="button"
              onClick={() => setCategory('single')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                category === 'single'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {isBn ? 'সিঙ্গেল প্যাক' : 'Single Packs'} ({singleCount})
            </button>

            <button
              type="button"
              onClick={() => setCategory('combo')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer animate-vibrate ${
                category === 'combo'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black border border-amber-300'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-amber-300 hover:text-amber-200 border border-amber-500/50 shadow-xs'
              }`}
            >
              🔥 {isBn ? 'কম্বো ভ্যালু প্যাক' : 'Combo Packs'} ({comboCount})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content Layout (SoulCove Structure: Sub-heading toolbar + 4-column Grid with Sidebar & Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Page Sub-Heading & Product Count & Sort Bar (SoulCove ShopPage Header) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-rose-200/70 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
              {category === 'combo' 
                ? (isBn ? 'কম্বো ভ্যালু প্যাক কালেকশন' : 'Combo Value Collection')
                : category === 'single'
                ? (isBn ? 'সিঙ্গেল বক্স কালেকশন' : 'Single Packs Collection')
                : (isBn ? 'সকল প্রিমিয়াম সামগ্রী' : 'All Products Collection')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isBn 
                ? 'আইএসও সার্টিফাইড আসল পণ্য, ১০০% নামহীন ক্যাশ অন ডেলিভারিতে।' 
                : 'ISO certified authentic wellness items with 100% confidential discreet home delivery.'}
            </p>
          </div>

          {/* Product Count & Sort Dropdown + Mobile Filter Trigger */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">
              {isBn ? 'প্রদর্শিত হচ্ছে' : 'Showing'} <strong className="text-slate-900">{displayedKeys.length}</strong> {isBn ? 'টি প্রোডাক্ট' : 'products'}
            </span>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-rose-50"
              >
                <svg className="h-3.5 w-3.5 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>{isBn ? 'ফিল্টার' : 'Filters'}</span>
              </button>

              {/* Sort By Select Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 text-xs bg-white border border-rose-200 rounded-xl px-3 text-slate-800 font-medium shadow-2xs focus:outline-none focus:border-brand-600 cursor-pointer"
              >
                <option value="featured">{isBn ? 'জনপ্রিয়তা অনুযায়ী' : 'Featured First'}</option>
                <option value="newest">{isBn ? 'নতুন কালেকশন' : 'Newest Drops'}</option>
                <option value="price-asc">{isBn ? 'দাম: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price-desc">{isBn ? 'দাম: বেশি থেকে কম' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Grid Layout: Sidebar Filters + Products (SoulCove grid-cols-1 lg:grid-cols-4) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Sidebar Filters (SoulCove Sidebar Structure) */}
          <aside
            className={`lg:block ${
              mobileFilterOpen
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

            {/* Categories / Pack Type Filter Box */}
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
                <button
                  onClick={() => setCategory('all')}
                  className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                    category === 'all'
                      ? 'bg-rose-50 font-semibold text-brand-900 border border-rose-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{isBn ? 'সকল প্রোডাক্ট' : 'All Categories'}</span>
                  <span>{productKeys.length}</span>
                </button>

                <button
                  onClick={() => setCategory('single')}
                  className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                    category === 'single'
                      ? 'bg-rose-50 font-semibold text-brand-900 border border-rose-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{isBn ? 'সিঙ্গেল প্যাক' : 'Single Packs'}</span>
                  <span>{singleCount}</span>
                </button>

                <button
                  onClick={() => setCategory('combo')}
                  className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                    category === 'combo'
                      ? 'bg-amber-100/90 font-semibold text-amber-950 border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🔥 {isBn ? 'কম্বো ভ্যালু প্যাক' : 'Combo Packs'}</span>
                  <span>{comboCount}</span>
                </button>
              </div>
            </div>

            {/* Price Range Filter (SoulCove Price Filter Box) */}
            <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-900">
                {isBn ? 'মূল্য সীমা' : 'Price'}
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
                    onClick={() => setPriceRange(tier.id)}
                    className={`flex w-full items-center justify-between py-2 px-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                      priceRange === tier.id
                        ? 'bg-rose-50 font-semibold text-brand-900 border border-rose-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle (SoulCove Checkbox & Label Box) */}
            <div className="rounded-2xl bg-white p-5 border border-rose-200/60 shadow-2xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  id="stock-filter"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 accent-rose-600 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  {isBn ? 'শুধুমাত্র ইন স্টক প্রোডাক্ট' : 'In Stock Items Only'}
                </span>
              </label>
            </div>

            {/* Reset Filters CTA (SoulCove Button) */}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
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
                {/* Product Cards Grid: 2 cols mobile, 3 cols desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {paginatedKeys.map((key) => (
                    <ProductCard key={key} productKey={key} />
                  ))}
                </div>

                {/* Load More Button (SoulCove Load More Cuties module) */}
                {hasMore && (
                  <div className="flex flex-col items-center justify-center pt-4">
                    <p className="text-xs text-slate-500 mb-3">
                      {isBn
                        ? `প্রদর্শিত হচ্ছে ${paginatedKeys.length} / মোট ${displayedKeys.length} টি প্রোডাক্ট`
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

