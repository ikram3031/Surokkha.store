import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from './ProductArtwork';

export default function PromoComboBanner() {
  const buyNowDirect = useStore((state) => state.buyNowDirect);
  const addToCart = useStore((state) => state.addToCart);
  const openCartDrawer = useStore((state) => state.openCartDrawer);
  const products = useStore((state) => state.products);
  const { isBn, formatPrice, formatNumber, getLocalizedName } = useTranslation();

  // Dynamically detect active 30-pcs or primary combo product
  const activeCombo = Object.values(products).find(p => {
    if (!p || p.isActive === false) return false;
    const isOut = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
    if (isOut) return false;
    const isCombo = p.categorySlug === 'combo' || (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo'));
    const is30 = (p.slug && p.slug.includes('30')) || (p.name && p.name.includes('30'));
    return isCombo && is30;
  }) || Object.values(products).find(p => {
    if (!p || p.isActive === false) return false;
    const isOut = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
    if (isOut) return false;
    return p.categorySlug === 'combo' || (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo'));
  });

  const comboKey = activeCombo?.slug || activeCombo?.id || 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
  const comboProd = activeCombo || products[comboKey] || products['mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'] || products['variety-condoms-30pcs-combo'] || products['combo-26'];

  if (!comboProd || comboProd.isActive === false || comboProd.isOutOfStock || comboProd.stockStatus === 'outofstock' || comboProd.stockStatus === 'out_of_stock' || comboProd.stockAmount === 0) {
    return null;
  }
  const isOutOfStock = false;

  const stockAmount = Number(comboProd.stockAmount != null ? comboProd.stockAmount : (comboProd.stock != null ? comboProd.stock : 50));
  const isLowStock = stockAmount > 0 && stockAmount <= 10;

  const currentOfferPrice = Number(comboProd.offerPrice || comboProd.price || 0);
  const currentRegularPrice = Number(comboProd.regularPrice || currentOfferPrice);
  const savingsAmount = currentRegularPrice > currentOfferPrice ? currentRegularPrice - currentOfferPrice : 0;
  const savingsPercent = currentRegularPrice > 0 ? Math.round((savingsAmount / currentRegularPrice) * 100) : 0;

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    buyNowDirect(comboKey);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(comboKey, 1, true);
    openCartDrawer();
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1c0612] via-[#2c091b] to-[#13030b] border-2 border-brand-500/50 shadow-2xl p-6 sm:p-8 md:p-10 text-white">
        
        {/* Subtle Ambient Radial Lighting Effects */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Decorative Grid Lines / Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Visual Showcase of the 3 Product Boxes */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            
            {/* Visual 3-Pack Stacking Showcase */}
            <div className="relative flex items-center justify-center py-4 w-full max-w-md">
              
              {/* Box 1: Left Angled - Textured Matrix */}
              <div 
                onClick={() => !isOutOfStock && buyNowDirect(comboKey)}
                className="w-28 sm:w-36 -rotate-6 transform hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer drop-shadow-2xl z-10"
                title={isBn ? 'MO টেক্সচার্ড ম্যাট্রিক্স (১০ পিস)' : 'MO Textured Matrix (10 pcs)'}
              >
                <div className="bg-slate-900/90 rounded-2xl p-1.5 border border-rose-500/40 shadow-xl overflow-hidden">
                  <ProductArtwork productKey="mo-dotted-condom" sizeClass="w-full h-32 sm:h-44" imgClassName="w-full h-full object-cover object-center rounded-xl" />
                </div>
                <div className="text-center mt-1.5">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/60">
                    {isBn ? 'টেক্সচার্ড (১০)' : 'Textured (10)'}
                  </span>
                </div>
              </div>

              {/* Box 2: Center Elevated - Ultra Thin */}
              <div 
                onClick={() => !isOutOfStock && buyNowDirect(comboKey)}
                className="w-32 sm:w-40 -mt-4 transform hover:scale-110 transition-all duration-300 cursor-pointer drop-shadow-2xl z-20"
                title={isBn ? 'MO আল্ট্রা থিন ০.০৩ মিমি (১০ পিস)' : 'MO Ultra Thin 0.03mm (10 pcs)'}
              >
                <div className="bg-slate-900/95 rounded-2xl p-2 border-2 border-amber-400/80 shadow-2xl relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap z-30">
                    ⭐ {isBn ? 'টপ সেলার' : 'Best Seller'}
                  </div>
                  <ProductArtwork productKey="mo-ultra-thin-condom" sizeClass="w-full h-36 sm:h-48" imgClassName="w-full h-full object-cover object-center rounded-xl" />
                </div>
                <div className="text-center mt-1.5">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/60">
                    {isBn ? 'আল্ট্রা থিন (১০)' : 'Ultra Thin (10)'}
                  </span>
                </div>
              </div>

              {/* Box 3: Right Angled - Contoured Ridges */}
              <div 
                onClick={() => !isOutOfStock && buyNowDirect(comboKey)}
                className="w-28 sm:w-36 rotate-6 transform hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer drop-shadow-2xl z-10"
                title={isBn ? 'MO কনট্যুরড রিজ (১০ পিস)' : 'MO Contoured Ridges (10 pcs)'}
              >
                <div className="bg-slate-900/90 rounded-2xl p-1.5 border border-purple-500/40 shadow-xl overflow-hidden">
                  <ProductArtwork productKey="mo-ultra-ribbed-condom" sizeClass="w-full h-32 sm:h-44" imgClassName="w-full h-full object-cover object-center rounded-xl" />
                </div>
                <div className="text-center mt-1.5">
                  <span className="text-[10px] sm:text-xs font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/60">
                    {isBn ? 'কনট্যুরড (১০)' : 'Contoured (10)'}
                  </span>
                </div>
              </div>

            </div>

            {/* Total Quantity Pill */}
            <div className="mt-3 flex items-center justify-center">
              <span className="text-sm sm:text-base font-extrabold text-white bg-white/15 px-4 py-1.5 rounded-xl border border-white/25 shadow-xs tracking-wide">
                {isBn ? 'মোট ৩টি সম্পূর্ণ বক্স = ৩০ পিস' : 'Total 3 Sealed Boxes = 30 Units'}
              </span>
            </div>

          </div>

          {/* Right Column: Promotional Copy, Price & Sales CTAs */}
          <div className="lg:col-span-6 space-y-4 text-left">
            
            {isOutOfStock ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-700 text-white font-black text-xs uppercase tracking-wider shadow-md">
                <span>🚫</span>
                <span>{isBn ? 'বর্তমানে আউট অব স্টক' : 'Currently Out of Stock'}</span>
              </div>
            ) : isLowStock ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-md animate-pulse">
                <span>🔥</span>
                <span>{isBn ? `স্টক সীমিত: মাত্র ${formatNumber(stockAmount)}টি বাকি আছে!` : `Only ${stockAmount} units remaining!`}</span>
              </div>
            ) : null}

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-white leading-tight">
              {isBn ? (
                <>
                  ৩ প্যাকেট একসাথে মাত্র <span className="text-amber-400 underline decoration-amber-400/80 underline-offset-6">৳{currentOfferPrice}</span> টাকায়!
                </>
              ) : (
                <>
                  Get All 3 Packs for Just <span className="text-amber-400 underline decoration-amber-400/80 underline-offset-6">৳{currentOfferPrice}</span>!
                </>
              )}
            </h2>

            {/* Detailed Price & Savings Display Box */}
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-rose-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-rose-300 font-bold uppercase tracking-wider mb-0.5">
                  {isOutOfStock ? (isBn ? 'মূল্য (স্টক শেষ)' : 'Price (Out of Stock)') : (isBn ? 'কম্বো অফার মূল্য' : 'Combo Special Price')}
                </div>
                <div className="flex items-baseline gap-2.5">
                  <span className={`text-3xl sm:text-4xl font-black font-heading ${isOutOfStock ? 'text-slate-400' : 'text-amber-400'}`}>
                    {formatPrice(currentOfferPrice)}
                  </span>
                  {currentRegularPrice > currentOfferPrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through">
                      {formatPrice(currentRegularPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Savings Callout */}
              {isOutOfStock ? (
                <div className="text-right">
                  <div className="inline-block bg-rose-600 text-white font-black text-xs sm:text-sm px-3 py-1 rounded-xl shadow-md">
                    {isBn ? 'স্টক শেষ' : 'Out of Stock'}
                  </div>
                </div>
              ) : savingsAmount > 0 ? (
                <div className="text-right">
                  <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-1 rounded-xl shadow-md">
                    {isBn ? `নগদ ৳${savingsAmount} সাশ্রয় (${savingsPercent}% ছাড়)` : `Save ৳${savingsAmount} (${savingsPercent}% OFF)`}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isBn ? `রেগুলার: ৳${currentRegularPrice}` : `Regular: ৳${currentRegularPrice}`}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Action Buttons: 1-Click Buy Now & Add to Cart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Primary 1-Click Order Button */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`w-full font-extrabold text-sm sm:text-base py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600 shadow-none'
                    : 'bg-gradient-to-r from-rose-600 via-brand-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-xl hover:shadow-rose-600/30 active:scale-98 cursor-pointer border border-rose-400/40'
                }`}
              >
                <span>{isOutOfStock ? '🚫' : '⚡'}</span>
                <span>{isOutOfStock ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : (isBn ? 'অর্ডার করুন' : 'Order Now')}</span>
              </button>

              {/* Secondary Add to Cart Button */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`w-full font-bold text-xs sm:text-sm py-3.5 px-5 rounded-2xl border transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-white/5 text-slate-400 border-white/10 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 cursor-pointer active:scale-98'
                }`}
              >
                <svg className={`w-4 h-4 ${isOutOfStock ? 'text-slate-400' : 'text-amber-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>{isOutOfStock ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : (isBn ? 'কার্টে যোগ করুন' : 'Add to Cart')}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
