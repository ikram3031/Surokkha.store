import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from '../components/ProductArtwork';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import HeroSlider from '../components/HeroSlider';
import PromoComboBanner from '../components/PromoComboBanner';
import TestimonialCarousel from '../components/TestimonialCarousel';

export default function HomeView() {
  const navigateTo = useStore((state) => state.navigateTo);
  const addToCart = useStore((state) => state.addToCart);
  const addComboToCart = useStore((state) => state.addComboToCart);
  const buyNowDirect = useStore((state) => state.buyNowDirect);
  const openProduct = useStore((state) => state.openProduct);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);

  const { 
    t, 
    language, 
    isBn,
    formatPrice, 
    getLocalizedName, 
    getLocalizedTagline, 
    getLocalizedDescription, 
    getLocalizedFeatures 
  } = useTranslation();

  const singleProductKeys = productKeys.filter((k) => {
    const p = products[k];
    if (!p) return false;
    const isOutOfStock = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
    if (isOutOfStock) return false;
    const isCombo = k.toLowerCase().includes('combo') || (p?.name && p.name.toLowerCase().includes('combo')) || (p?.category && String(p.category).toLowerCase().includes('combo')) || (p?.category_bn && p.category_bn.includes('কম্বো'));
    return !isCombo;
  });

  const available20PcsComboKeys = [
    'ultra-thin-condoms-20pcs-combo',
    'ribbed-condoms-20pcs-combo',
    'dotted-condoms-20pcs-combo'
  ].filter((k) => {
    const p = products[k];
    return p && !p.isOutOfStock && p.stockStatus !== 'outofstock' && p.stockStatus !== 'out_of_stock' && p.stockAmount !== 0;
  });

  return (
    <div className="space-y-6 sm:space-y-8 bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 pb-4">
      
      {/* PURE HERO BANNER SLIDER (Dashboard CMS Uploaded) */}
      <HeroSlider />

      {/* 3 DEDICATED FEATURE CARDS (Directly Under Hero Slider, White Theme) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Feature 1: 100% Private Packaging */}
          <div className="bg-white border border-slate-200/90 hover:border-rose-300 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center gap-4 text-left">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-inner">
              🔒
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading leading-snug">
                {isBn ? '১০০% প্রাইভেট ও ডিসক্রিট' : '100% Discreet & Confidential'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isBn ? 'বাইরে কোনো পণ্যের নাম বা লেবেল ছাড়া সিল করা পার্সেল।' : 'Plain unmarked packaging with zero external product labels.'}
              </p>
            </div>
          </div>

          {/* Feature 2: Cash on Delivery */}
          <div className="bg-white border border-slate-200/90 hover:border-rose-300 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center gap-4 text-left">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-inner">
              🚚
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading leading-snug">
                {isBn ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery (COD)'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isBn ? 'পণ্য হাতে পেয়ে নিশ্চিন্তে টাকা পরিশোধের সুবিধা।' : 'Pay securely in cash directly upon doorstep handoff.'}
              </p>
            </div>
          </div>

          {/* Feature 3: 100% Authentic Quality */}
          <div className="bg-white border border-slate-200/90 hover:border-rose-300 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center gap-4 text-left">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading leading-snug">
                {isBn ? '১০০% আসল প্রিমিয়াম কোয়ালিটি' : '100% Authentic MO Quality'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isBn ? 'ইলেকট্রনিক্যালি টেস্টেড আন্তর্জাতিক মানের প্রোডাক্ট।' : 'Electronically pinhole-tested certified wellness products.'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* DEDICATED PRODUCT SECTION (The MO Lineup) */}
      <section id="productsSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/70">
            {t('featuredCollection', 'Featured Collection')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3">
            {t('theMoLineup', 'The MO Lineup')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
            {t('home.lineup_desc', 'Authentic ISO-certified barrier devices engineered for reliable family planning.')}
          </p>
        </div>

        {/* Dynamic Compact Sales-Focused Product Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {isLoadingProducts ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <ProductCardSkeleton key={`skeleton-home-${idx}`} />
            ))
          ) : (
            singleProductKeys.map((key) => (
              <ProductCard key={key} productKey={key} />
            ))
          )}
        </div>
      </section>

      {/* COMBO SALES & VALUE SHOWCASE BANNER (Only shown if 20pcs combos in stock) */}
      {available20PcsComboKeys.length > 0 && (
        <section id="comboSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0b0a0e] border-2 border-brand-600/40 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
            
            {/* Background Banner-2 Image with low opacity & gradient overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <img 
                src="https://api.surokkha.store/uploads/assets/slider-2.webp" 
                alt="MO Combo Background" 
                className="w-full h-full object-cover object-center opacity-20 scale-105"
                onError={(e) => { 
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  if (e && e.currentTarget) e.currentTarget.style.display = 'none'; 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0a0e] via-[#0b0a0e]/90 to-[#0b0a0e]/80" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sales Copy & Value Proposition */}
              <div className="lg:col-span-8 space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/90 border border-brand-500/60 text-xs font-bold text-amber-300">
                  <span className="animate-pulse">🔥</span>
                  <span>{isBn ? 'মেগা সেভিংস অফার • ২০ পিস বিশেষ কম্বো প্যাক' : 'Mega Savings Deal • 20pcs Exclusive Combo Packs'}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white leading-tight">
                  {isBn ? (
                    <>
                      কম্বো অফার কালেকশন — <span className="text-amber-400">২০ পিস মেগা ভ্যালু বান্ডেল</span>
                    </>
                  ) : (
                    <>
                      MO Combo Deals — <span className="text-amber-400">20pcs Mega Value Bundles</span>
                    </>
                  )}
                </h2>

                <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
                  {isBn ? (
                    <>
                      আমাদের ২০ পিস মেগা কম্বো প্যাকেজে পাচ্ছেন আসল MO কন্ট্রাসেপ্টিভ কম্বো বান্ডেল। সম্পূর্ণ ১০০% গোপন ডেলিভারিতে অর্ডার করুন।
                    </>
                  ) : (
                    <>
                      Explore authentic 20pcs Mega Combos in 1 discreet parcel.
                    </>
                  )}
                </p>

                {/* In-Stock Combo Packs Quick Selector Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {available20PcsComboKeys.map((k) => {
                    const cProd = products[k];
                    if (!cProd) return null;
                    const cName = isBn ? (cProd.name_bn || cProd.name) : cProd.name;
                    const cPrice = cProd.price || 599;
                    const cRegular = cProd.regularPrice || 800;

                    return (
                      <div 
                        key={k}
                        onClick={() => navigateTo('offers')}
                        className="bg-slate-900/90 hover:bg-slate-800/90 border border-rose-400/50 hover:border-rose-400 rounded-xl p-3 text-left cursor-pointer transition shadow-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-300 mb-1">
                          <span className="truncate">{cName}</span>
                          <span className="bg-rose-500/80 text-white text-[10px] px-1.5 py-0.2 rounded font-bold ml-1 flex-shrink-0">20 PCS</span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">{cName}</div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs text-rose-300 font-extrabold font-heading">
                            <span className="text-[10px] text-rose-200/80 font-normal mr-1">{isBn ? 'অফার:' : 'Offer:'}</span>
                            {formatPrice(cPrice)}
                          </span>
                          {cRegular > cPrice && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatPrice(cRegular)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA & Sales Action Box */}
              <div className="lg:col-span-4 flex flex-col gap-3 justify-center bg-slate-900/80 p-5 rounded-2xl border border-slate-700/80 shadow-xl">
                <button 
                  type="button"
                  onClick={() => navigateTo('offers')} 
                  aria-label={isBn ? 'সকল কম্বো অফার দেখুন' : 'Explore All Combo Offers'}
                  className="w-full bg-gradient-to-r from-[#F43F5E] via-[#E11D48] to-[#BE123C] hover:from-[#FB7185] hover:to-[#9F1239] text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-rose-400/40"
                >
                  <span>{isBn ? '🔥 সকল কম্বো অফার দেখুন' : '🔥 View All Combo Offers'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <button 
                  type="button"
                  onClick={() => navigateTo('offers')} 
                  aria-label={isBn ? 'কম্বো অফার কালেকশন' : 'Combo Offer Collection'}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isBn ? 'সকল কম্বো কালেকশন' : 'Explore All Combos'}</span>
                </button>

                <button 
                  type="button"
                  onClick={() => navigateTo('shop')} 
                  aria-label={isBn ? 'সকল প্রোডাক্ট শপ দেখুন' : 'Explore Shop'}
                  className="text-xs text-slate-300 hover:text-amber-300 font-semibold py-1 transition text-center underline underline-offset-4 cursor-pointer"
                >
                  {isBn ? 'সুরক্ষা শপে সকল প্রোডাক্ট দেখুন →' : 'Browse All Products in Shop →'}
                </button>

                <div className="pt-2 border-t border-slate-700/60 text-center space-y-1">
                  <p className="text-[11px] text-emerald-400 font-medium">✓ {isBn ? '১০০% গোপনীয় আনলেবেলড প্যাকেজিং' : '100% Discreet Unmarked Parcel'}</p>
                  <p className="text-[11px] text-slate-300">{isBn ? 'পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা' : 'Pay when you receive the package'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHY SUROKKHA / SERVICE STANDARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/70">
              {t('serviceStandardsBadge', 'সুরক্ষা সেবা মান')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3">
              {t('serviceStandardsTitle', 'কেন Surokkha.store থেকে কিনবেন?')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              {t('serviceStandardsSubtitle', 'সারা বাংলাদেশে নির্ভরযোগ্য ও সম্পূর্ণ গোপনীয় কেনাকাটা।')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Authentic Product (Blue Accent) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 border border-sky-100/80 flex items-center justify-center mb-3.5 text-lg font-bold">
                🛡️
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('benefit1Title', '১০০% আসল প্রোডাক্ট')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('benefit1Desc', 'সরাসরি আসল MO পণ্য যা আন্তর্জাতিক মানের ইলেকট্রনিক পিনহোল পরীক্ষায় উত্তীর্ণ।')}</p>
            </div>

            {/* 2. Discreet Delivery (Amber Accent) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 flex items-center justify-center mb-3.5 text-lg font-bold">
                📦
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('benefit2Title', '১০০% গোপনীয় ডেলিভারি')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('benefit2Desc', 'বাইরে কোনো লেবেল বা পণ্যের নাম ছাড়া সিল করা সাধারণ পার্সেল। পূর্ণ গোপনীয়তা নিশ্চিত।')}</p>
            </div>

            {/* 3. Easy Online Order (Orange Accent) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100/80 flex items-center justify-center mb-3.5 text-lg font-bold">
                ⚡
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('benefit3Title', 'সহজ অনলাইন অর্ডার')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('benefit3Desc', 'কোনো ঝামেলা বা বাধ্যতামূলক অ্যাকাউন্ট তৈরি ছাড়াই কয়েক সেকেন্ডে সরাসরি অর্ডার সম্পন্ন করুন।')}</p>
            </div>

            {/* 4. Variety Options (Pink Accent) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 border border-pink-100/80 flex items-center justify-center mb-3.5 text-lg font-bold">
                🎯
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('benefit4Title', 'ভ্যারাইটি অপশন')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('benefit4Desc', 'আপনার ব্যক্তিগত পছন্দ অনুযায়ী MO ডটেড, MO আল্ট্রা থিন বা MO আল্ট্রা রিবড নির্বাচন করুন।')}</p>
            </div>

            {/* 5. Easy Checkout (Purple Accent) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center mb-3.5 text-lg font-bold">
                📝
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('benefit5Title', 'সহজ চেকআউট পদ্ধতি')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('benefit5Desc', 'বাংলাদেশের জন্য বিশেষ উপযোগী সহজ ঠিকানা ও দ্রুততম অর্ডার নিশ্চিতকরণ প্রক্রিয়া।')}</p>
            </div>

            {/* 6. Cash on Delivery (Rose Accent) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/80 flex items-center justify-center mb-3.5 text-lg font-bold">
                ৳
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{t('benefit6Title', 'ক্যাশ অন ডেলিভারি')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t('benefit6Desc', 'পার্সেল হাতে পেয়ে ডেলিভারিম্যানের কাছে সরাসরি মূল্য (৳) পরিশোধের সুবিধা।')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIAL 3-PACK COMBO PROMO BANNER (Directly Above Testimonial) */}
      <PromoComboBanner />

      {/* CUSTOMER REVIEWS & TESTIMONIALS CAROUSEL (Directly Before Footer) */}
      <TestimonialCarousel />

    </div>
  );
}
