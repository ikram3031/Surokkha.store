import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from '../components/ProductArtwork';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import HeroSlider from '../components/HeroSlider';
import TrialPackHero from '../components/TrialPackHero';
import PromoComboBanner from '../components/PromoComboBanner';
import ProductCarousel from '../components/ProductCarousel';
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
    formatNumber,
    getLocalizedName, 
    getLocalizedTagline, 
    getLocalizedDescription, 
    getLocalizedFeatures 
  } = useTranslation();

  // Filter exclusively the 3 single contraceptive products from the 'products' collection (The MO Lineup)
  const moLineupKeys = productKeys.filter((k) => {
    const p = products[k];
    if (!p) return false;
    const isFromProductsCollection = p.itemType === 'product' || p.entityType === 'product';
    const isCombo = p.categorySlug === 'combo' || (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo'));
    const isContraceptive = p.categorySlug === 'contraceptive' || 
      (p.slug && (p.slug.includes('contraceptive') || p.slug.includes('latex') || p.slug.includes('mo-')));
    return isFromProductsCollection && !isCombo && isContraceptive;
  }).slice(0, 3);

  const displaySingleKeys = moLineupKeys.length > 0 ? moLineupKeys : productKeys.slice(0, 3);

  const activeCombos = Object.values(products).filter(p => {
    return p && !p.isOutOfStock && p.stockStatus !== 'outofstock' && p.stockStatus !== 'out_of_stock' && p.isActive !== false &&
      (p.categorySlug === 'combo' || (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo')));
  });
  
  const isComboActive = (p) => p && p.isActive !== false && !p.isOutOfStock &&
    p.stockStatus !== 'outofstock' && p.stockStatus !== 'out_of_stock' && p.stockAmount !== 0;

  // LEFT combo card = the 3-variant mega combo (Ultra Thin + Dotted + Ribbed).
  // Pinned to the Ultimate 3-in-1 product; falls back to any active 3-in-1 / 30-pcs combo.
  const LEFT_COMBO_ID = '6ab8a664721c81cc89218856';
  const LEFT_COMBO_SLUG = 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
  const pinnedLeftProd = products[LEFT_COMBO_ID] || products[LEFT_COMBO_SLUG];
  const combo30Prod = (isComboActive(pinnedLeftProd) ? pinnedLeftProd : null) ||
    activeCombos.find(c => (c.slug && (c.slug.includes('3-in-1') || c.slug.includes('30'))) || (c.name && c.name.includes('30'))) ||
    activeCombos[0] || null;

  // RIGHT combo card = the Ultra Thin 30-pcs combo. Pinned to the Micro-Thin Combo Special;
  // falls back to any other active combo different from the left card.
  const RIGHT_COMBO_ID = '6ad3ceaa778c3e05ca22b2bd';
  const RIGHT_COMBO_SLUG = 'combo-special-30-pieces-of-micro-thin-latex-contraceptive';
  const pinnedRightProd = products[RIGHT_COMBO_ID] || products[RIGHT_COMBO_SLUG];
  const comboRibbedProd = (isComboActive(pinnedRightProd) && pinnedRightProd !== combo30Prod ? pinnedRightProd : null) ||
    activeCombos.find(c => c !== combo30Prod && ((c.slug && (c.slug.includes('thin') || c.slug.includes('30'))) || (c.name && c.name.includes('30')))) ||
    activeCombos.find(c => c !== combo30Prod) || activeCombos[1] || null;
  const COMBO_30_KEY = combo30Prod?.slug || combo30Prod?.id || '';
  const COMBO_RIBBED_KEY = comboRibbedProd?.slug || comboRibbedProd?.id || '';

  return (
    <div className="space-y-6 sm:space-y-8 bg-gradient-to-b from-[#faf5f6]/50 via-white to-[#faf5f6]/40 pb-4">
      
      {/* PURE HERO BANNER SLIDER (Dashboard CMS Uploaded) — hidden for now.
          To restore it, change `false` to `true` below. */}
      {false && <HeroSlider />}

      {/* TRIAL PACK PROMO HERO */}
      <TrialPackHero />

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
            displaySingleKeys.map((key) => (
              <ProductCard key={key} productKey={key} />
            ))
          )}
        </div>
      </section>

      {/* HIGH-CONVERSION SPOTLIGHT COMBO SHOWCASE */}
      {activeCombos.length > 0 && (
        <section id="comboSection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0b0a0e] border-2 border-brand-600/40 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          
          {/* Ambient Lighting & Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0a0e] via-[#0b0a0e]/95 to-[#0b0a0e]/85" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-600/15 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-6">
            
            {/* Header: Value Proposition */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-950/90 border border-brand-500/60 text-xs font-bold text-amber-300 mb-2">
                  <span className="animate-pulse">🔥</span>
                  <span>{isBn ? 'মেগা সেভিংস অফার • স্পেশাল কম্বো কালেকশন' : 'Mega Savings Deals • Exclusive Combo Packs'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white leading-tight">
                  {isBn ? (
                    <>
                      সেরা কম্বো অফার — <span className="text-amber-400">সাশ্রয়ী মূল্যে প্রিমিয়াম বান্ডেল</span>
                    </>
                  ) : (
                    <>
                      Featured Combos — <span className="text-amber-400">Premium Value Bundles</span>
                    </>
                  )}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  {isBn ? '১টি প্যাকেজে পান অধিক পরিমাণ ও নিশ্চিত সাশ্রয়। ১০০% গোপনীয় আনলেবেলড ডেলিভারি।' : 'Get maximum protection & verified savings in 1 discreet parcel.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo('combo')}
                  className="text-xs sm:text-sm font-bold text-amber-300 hover:text-amber-200 underline underline-offset-4 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isBn ? 'সকল কম্বো কালেকশন দেখুন' : 'View All Combos'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* 2 Focused Combo Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-1">
              
              {/* COMBO 1: 30-Pcs Ultimate Mega Combo (৳900) - Star Product */}
              {(() => {
                if (!combo30Prod) return null;
                const c30Name = isBn ? (combo30Prod.name_bn || combo30Prod.name) : (combo30Prod.name || combo30Prod.name_bn);
                const c30Price = combo30Prod.offerPrice || combo30Prod.price || 0;
                const c30Regular = combo30Prod.regularPrice || c30Price;
                const c30Savings = c30Regular > c30Price ? c30Regular - c30Price : 0;
                const c30PerUnit = c30Price > 0 ? Math.round(c30Price / 30) : 0;

                return (
                  <div className="bg-slate-900/90 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 text-left relative flex flex-col justify-between shadow-2xl hover:border-amber-300 transition-all duration-300 group">
                    <div className="absolute -top-3.5 right-6 z-20 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xl flex items-center gap-1 border border-amber-300/40">
                      <span>⭐</span>
                      <span>{isBn ? `সবচেয়ে জনপ্রিয় মেগা কম্বো (${formatPrice(c30Price)})` : `Most Popular Deal (${formatPrice(c30Price)})`}</span>
                    </div>

                    <div className="space-y-4">
                      {/* Image & Contents Row */}
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => openProduct(COMBO_30_KEY)} 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/40 flex-shrink-0 cursor-pointer p-1"
                        >
                          <ProductArtwork productKey={combo30Prod} customImageUrl={combo30Prod?.imageUrl} sizeClass="w-full h-full" imgClassName="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            onClick={() => openProduct(COMBO_30_KEY)} 
                            className="text-base sm:text-lg font-bold font-heading text-white hover:text-amber-300 transition cursor-pointer mt-0.5 line-clamp-2"
                          >
                            {c30Name}
                          </h3>
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                            {isBn ? '১টি আল্ট্রা থিন (১০ পিস) + ১টি ডটেড (১০ পিস) + ১টি আল্ট্রা রিবড (১০ পিস) = মোট ৩ বক্স।' : '1x Ultra Thin + 1x Dotted + 1x Ribbed = 3 Full Sealed Retail Boxes.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Savings Box */}
                      <div className="bg-slate-950/90 rounded-2xl p-3.5 border border-amber-500/30 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                            {isBn ? 'কম্বো অফার মূল্য' : 'Special Combo Price'}
                          </div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl sm:text-3xl font-black font-heading text-amber-400 animate-price-shake inline-block">
                              {formatPrice(c30Price)}
                            </span>
                            {c30Regular > c30Price && (
                              <span className="text-xs sm:text-sm text-slate-400 line-through">
                                {formatPrice(c30Regular)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
                            {isBn ? `নগদ ৳${c30Savings} সাশ্রয়` : `Save ৳${c30Savings}`}
                          </span>
                          <div className="text-[10px] text-emerald-400 font-bold mt-1">
                            {isBn ? `মাত্র ${formatPrice(c30PerUnit)} / পিস` : `Only ${formatPrice(c30PerUnit)} / unit`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="grid grid-cols-2 gap-2.5 pt-4">
                      <button
                        type="button"
                        onClick={() => buyNowDirect(COMBO_30_KEY)}
                        className="w-full bg-gradient-to-r from-[#F43F5E] via-[#E11D48] to-[#BE123C] hover:from-[#FB7185] hover:to-[#9F1239] text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-rose-400/40"
                      >
                        <span>⚡</span>
                        <span>{isBn ? 'অর্ডার করুন' : 'Order Now'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(COMBO_30_KEY, 1, true);
                          openCartDrawer();
                        }}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>🛒</span>
                        <span>{isBn ? 'কার্টে রাখুন' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* COMBO 2: 20-Pcs Micro-Ribbed Combo (৳650) - Limited Stock Spotlight ("রিফ্ট কম্বো") */}
              {(() => {
                if (!comboRibbedProd) return null;
                const cRibbedName = isBn ? (comboRibbedProd.name_bn || comboRibbedProd.name) : (comboRibbedProd.name || comboRibbedProd.name_bn);
                const cRibbedPrice = comboRibbedProd.offerPrice || comboRibbedProd.price || 0;
                const cRibbedRegular = comboRibbedProd.regularPrice || cRibbedPrice;
                const cRibbedSavings = cRibbedRegular > cRibbedPrice ? cRibbedRegular - cRibbedPrice : 0;
                const cRibbedPerUnit = cRibbedPrice > 0 ? Math.round(cRibbedPrice / 30) : 0;
                const rStock = Number(comboRibbedProd.stockAmount != null ? comboRibbedProd.stockAmount : (comboRibbedProd.stock != null ? comboRibbedProd.stock : 0));
                const rLow = rStock > 0 && rStock <= 10;

                return (
                  <div className="bg-slate-900/90 border-2 border-purple-500/80 rounded-3xl p-5 sm:p-6 text-left relative flex flex-col justify-between shadow-2xl hover:border-purple-400 transition-all duration-300 group">
                    <div className="absolute -top-3.5 right-6 z-20 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white text-[10px] sm:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xl flex items-center gap-1 border border-purple-400/40">
                      <span>🔥</span>
                      <span>
                        {rLow ? (isBn ? `স্টক সীমিত: মাত্র ${formatNumber(rStock)}টি বাকি!` : `Hurry! Only ${rStock} Left!`) : (isBn ? 'আল্ট্রা থিন ৩০ পিস স্পেশাল কম্বো' : 'Ultra Thin 30 Pcs Combo')}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Image & Contents Row */}
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => openProduct(COMBO_RIBBED_KEY)} 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-950 border border-purple-500/40 flex-shrink-0 cursor-pointer p-1"
                        >
                          <ProductArtwork productKey={comboRibbedProd} customImageUrl={comboRibbedProd?.imageUrl} sizeClass="w-full h-full" imgClassName="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 
                            onClick={() => openProduct(COMBO_RIBBED_KEY)} 
                            className="text-base sm:text-lg font-bold font-heading text-white hover:text-purple-300 transition cursor-pointer mt-0.5 line-clamp-2"
                          >
                            {cRibbedName}
                          </h3>
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                            {isBn ? '৩টি সম্পূর্ণ রিটেইল বক্স (৩০টি আল্ট্রা থিন ল্যাটেক্স কন্ট্রাসেপ্টিভ)। অতি-পাতলা অনুভূতি ও নির্ভরযোগ্য সুরক্ষা।' : '3 Sealed Retail Boxes (30 Pieces Ultra Thin Latex). Ultra-thin sensation with dependable protection.'}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Savings Box */}
                      <div className="bg-slate-950/90 rounded-2xl p-3.5 border border-purple-500/30 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                            {isBn ? 'কম্বো অফার মূল্য' : 'Special Combo Price'}
                          </div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl sm:text-3xl font-black font-heading text-purple-400 animate-price-shake inline-block">
                              {formatPrice(cRibbedPrice)}
                            </span>
                            {cRibbedRegular > cRibbedPrice && (
                              <span className="text-xs sm:text-sm text-slate-400 line-through">
                                {formatPrice(cRibbedRegular)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-gradient-to-r from-purple-500 to-rose-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
                            {isBn ? `সাশ্রয় ৳${cRibbedSavings}` : `Save ৳${cRibbedSavings}`}
                          </span>
                          <div className="text-[10px] text-amber-300 font-bold mt-1">
                            {isBn ? `${formatPrice(cRibbedPerUnit)} / পিস` : `${formatPrice(cRibbedPerUnit)} / unit`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="grid grid-cols-2 gap-2.5 pt-4">
                      <button
                        type="button"
                        onClick={() => buyNowDirect(COMBO_RIBBED_KEY)}
                        className="w-full bg-gradient-to-r from-purple-600 via-rose-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-purple-400/40"
                      >
                        <span>⚡</span>
                        <span>{isBn ? 'অর্ডার করুন' : 'Order Now'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(COMBO_RIBBED_KEY, 1, true);
                          openCartDrawer();
                        }}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <span>🛒</span>
                        <span>{isBn ? 'কার্টে রাখুন' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      </section>
      )}

      {/* RANDOMIZED NON-COMBO PRODUCT CAROUSEL (Max 10 Products) */}
      <ProductCarousel maxItems={10} />

      {/* WHY SUROKKHA / SERVICE STANDARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/70">
              {t('serviceStandardsBadge', 'সুরক্ষা সেবা মান')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3">
              {t('serviceStandardsTitle', 'কেন Surokkha.shop থেকে কিনবেন?')}
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
