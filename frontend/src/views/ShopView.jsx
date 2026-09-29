import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import ProductArtwork from '../components/ProductArtwork';
import PromoComboBanner from '../components/PromoComboBanner';
import TestimonialCarousel from '../components/TestimonialCarousel';

export default function ShopView() {
  const navigateTo = useStore((state) => state.navigateTo);
  const addToCart = useStore((state) => state.addToCart);
  const buyNowDirect = useStore((state) => state.buyNowDirect);
  const openProduct = useStore((state) => state.openProduct);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);

  const { t, isBn, formatPrice, getLocalizedName, getLocalizedTagline } = useTranslation();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'single', 'combo'

  const singleCount = productKeys.filter((k) => {
    const p = products[k];
    return !(k.toLowerCase().includes('combo') || p?.iconType === 'combo' || p?.category === 'Combo' || p?.category === 'Combo Pack');
  }).length;

  const comboCount = productKeys.filter((k) => {
    const p = products[k];
    return (k.toLowerCase().includes('combo') || p?.iconType === 'combo' || p?.category === 'Combo' || p?.category === 'Combo Pack');
  }).length;

  const filteredKeys = productKeys.filter((key) => {
    const prod = products[key];
    const isCombo = key.toLowerCase().includes('combo') || prod?.iconType === 'combo' || prod?.category === 'Combo' || prod?.category === 'Combo Pack';
    if (activeTab === 'single') return !isCombo;
    if (activeTab === 'combo') return isCombo;
    return true;
  });

  return (
    <div className="bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 min-h-screen pb-16">
      
      {/* Header Banner */}
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
              onClick={() => setActiveTab('all')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {isBn ? 'সকল প্রোডাক্ট' : 'All Products'} ({productKeys.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {isBn ? 'সিঙ্গেল প্যাক' : 'Single Packs'} ({singleCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('combo')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer animate-vibrate ${
                activeTab === 'combo'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black border border-amber-300'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-amber-300 hover:text-amber-200 border border-amber-500/50 shadow-xs'
              }`}
            >
              🔥 {isBn ? 'কম্বো ভ্যালু প্যাক' : 'Combo Packs'} ({comboCount})
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        
        {/* Results Counter & Quick Reassurance */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80 text-xs sm:text-sm text-slate-700 font-semibold">
          <div>
            <span>{isBn ? 'প্রদর্শিত হচ্ছে:' : 'Showing:'} </span>
            <span className="font-bold text-slate-900">{filteredKeys.length} {isBn ? 'টি প্রোডাক্ট' : 'Items'}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-600 font-bold">✓ {isBn ? '১০০% নামহীন গোপনীয় ডেলিভারি' : '100% Discreet Unmarked Parcel'}</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-rose-600 font-bold">✓ {isBn ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</span>
          </div>
        </div>

        {/* Dynamic Responsive Compact Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {isLoadingProducts ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <ProductCardSkeleton key={`skeleton-shop-${idx}`} />
            ))
          ) : (
            filteredKeys.map((key) => (
              <ProductCard key={key} productKey={key} />
            ))
          )}
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
