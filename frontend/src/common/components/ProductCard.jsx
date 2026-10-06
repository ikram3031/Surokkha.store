import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from './ProductArtwork';

export default function ProductCard({ productKey, className = '' }) {
  const products = useStore((state) => state.products);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const openCartDrawer = useStore((state) => state.openCartDrawer);
  const buyNowDirect = useStore((state) => state.buyNowDirect);
  const setProductQty = useStore((state) => state.setProductQty);
  const openProduct = useStore((state) => state.openProduct);
  const { isBn, formatNumber } = useTranslation();

  const prod = products[productKey];
  if (!prod) return null;

  const isOutOfStock = Boolean(prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0);
  if (isOutOfStock) return null;

  const stockAmount = Number(prod.stockAmount != null ? prod.stockAmount : (prod.stock != null ? prod.stock : 50));
  const isLowStock = !isOutOfStock && stockAmount > 0 && stockAmount <= 10;

  const currentCartQty = cart[productKey] || 0;
  const rawOffer = Number(prod.offerPrice || prod.offer_price || prod.sale_price || prod.salePrice || 0);
  const rawRegular = Number(prod.regularPrice || prod.regular_price || 0);
  const rawPrice = Number(prod.price || 0);

  const currentRegularPrice = Math.max(rawRegular, (rawOffer > 0 && rawPrice > rawOffer) ? rawPrice : 0, rawPrice > 0 ? rawPrice : 0);
  const candidateSelling = [rawOffer, rawPrice].map(Number).filter(v => !isNaN(v) && v > 0);
  const currentOfferPrice = candidateSelling.length > 0 ? Math.min(...candidateSelling) : 0;

  const hasDiscount = currentRegularPrice > currentOfferPrice && currentOfferPrice > 0;
  const savingsAmount = hasDiscount ? currentRegularPrice - currentOfferPrice : 0;
  const discountPercent = hasDiscount ? Math.round((savingsAmount / currentRegularPrice) * 100) : 0;

  const formatPrice = (val) => {
    const num = Number(val) || 0;
    if (isBn) {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return '৳' + String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
    }
    return `৳${num}`;
  };

  const localizedName = isBn ? (prod.name_bn || prod.name) : (prod.name || prod.title);

  // Combo highlight classification
  const is30Pcs = productKey.includes('30pcs') || productKey.includes('variety') || productKey === 'combo-26' || (prod.name && prod.name.includes('30'));
  const is20Pcs = productKey.includes('20pcs') || (prod.name && prod.name.includes('20'));
  const isTrio = is30Pcs;

  return (
    <div 
      className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-2xs hover:shadow-lg hover:-translate-y-0.5 ${
        isOutOfStock
          ? 'border-slate-200 opacity-90'
          : is20Pcs || isTrio 
          ? 'border-amber-300/80 hover:border-amber-400 ring-1 ring-amber-100/60' 
          : 'border-slate-200/90 hover:border-brand-500/60'
      } ${currentCartQty > 0 ? 'ring-2 ring-brand-600/30 border-brand-600' : ''} ${className}`}
    >
      {/* Visual Product Showcase - 1:1 Aspect Ratio Full Width */}
      <div 
        onClick={() => openProduct(productKey)} 
        className="cursor-pointer relative overflow-hidden bg-white w-full aspect-square flex items-center justify-center border-b border-slate-100"
      >
        <ProductArtwork 
          productKey={productKey} 
          customImageUrl={prod?.imageUrl || prod?.image_url || prod?.image || prod?.featuredImage || prod?.featured_image || (Array.isArray(prod?.images) ? prod.images[0] : null)}
          sizeClass="w-full h-full aspect-square"
          imgClassName="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Ribbon Badge (SS Design with Folded 3D Corner & Downward Chevron Point) */}
        {hasDiscount && discountPercent > 0 && (
          <div 
            className="absolute top-0 left-2 sm:left-2.5 z-20 pointer-events-none select-none drop-shadow-md transition-transform duration-200 group-hover:scale-105"
            title={`${discountPercent}% Discount`}
          >
            <svg 
              viewBox="0 0 70 65" 
              className="w-9 sm:w-11 h-auto overflow-visible" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`discountGrad-${productKey}`} x1="29" y1="0" x2="29" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FF0D1B" />
                  <stop offset="45%" stopColor="#EE000A" />
                  <stop offset="100%" stopColor="#C00003" />
                </linearGradient>
                <linearGradient id={`foldGrad-${productKey}`} x1="58" y1="0" x2="70" y2="13" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#B30005" />
                  <stop offset="100%" stopColor="#660002" />
                </linearGradient>
              </defs>
              {/* 3D Fold tab at top right */}
              <path d="M58 0 C65 0 70 2 70 5 C70 8.5 65 13 58 13 Z" fill={`url(#foldGrad-${productKey})`} />
              {/* Main Ribbon Body (with rounded top-left corner and sharp downward chevron at bottom) */}
              <path d="M4 0 H58 V52 L29 64 L0 52 V4 Q0 0 4 0 Z" fill={`url(#discountGrad-${productKey})`} />
              {/* Top inner highlight sheen */}
              <path d="M4 1.5 H57" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
              {/* White Bold Text: -<percent>% */}
              <text 
                x="29" 
                y="27" 
                textAnchor="middle" 
                dominantBaseline="central" 
                fill="#FFFFFF" 
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  fontSize: String(discountPercent).length > 2 ? '17px' : '19px',
                  fontWeight: 900,
                  letterSpacing: '-0.5px'
                }}
              >
                -{discountPercent}%
              </text>
            </svg>
          </div>
        )}

        {/* Low Stock Urgent Badge (<10 Remaining) & Combo Highlights */}
        {isLowStock ? (
          <div className="absolute top-2 right-2 z-20 pointer-events-none select-none">
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white/60 tracking-tight animate-pulse">
              <span>🔥</span>
              <span>{isBn ? `অনলি ${formatNumber(stockAmount)}টি বাকি!` : `Only ${stockAmount} left!`}</span>
            </span>
          </div>
        ) : is30Pcs ? (
          <div className="absolute top-2 right-2 z-20 pointer-events-none select-none">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md border border-amber-300 tracking-tight">
              <span>⭐</span>
              <span>{isBn ? 'বেস্ট ভ্যালু (৳৯০০)' : 'Best Value (৳900)'}</span>
            </span>
          </div>
        ) : is20Pcs ? (
          <div className="absolute top-2 right-2 z-20 pointer-events-none select-none">
            <span className="inline-flex items-center gap-1 bg-rose-950/85 text-amber-300 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md border border-amber-500/40 tracking-tight">
              <span>⚡</span>
              <span>{isBn ? '২০ পিস কম্বো' : '20 Pcs Combo'}</span>
            </span>
          </div>
        ) : null}

        {/* Out of Stock Visual Overlay */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-900/35 flex items-center justify-center pointer-events-none z-10">
            <span className="bg-rose-600 text-white text-[11px] sm:text-xs font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
              {isBn ? 'স্টক শেষ' : 'Out of Stock'}
            </span>
          </div>
        ) : (
          /* Quick View Floating Hint */
          <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs border border-slate-200 backdrop-blur-xs">
              {isBn ? 'বিস্তারিত দেখুন' : 'Quick View'}
            </span>
          </div>
        )}
      </div>

      {/* Compact Info Section */}
      <div className="p-3 pt-2.5 flex flex-col flex-grow justify-between border-t border-slate-100/90 bg-white">
        
        <div>
          {/* Product Title - Clean & Truncated with Tooltip */}
          <h3 
            onClick={() => openProduct(productKey)}
            className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-brand-700 transition cursor-pointer line-clamp-1 leading-snug font-heading"
            title={localizedName}
          >
            {localizedName}
          </h3>
        </div>

        {/* Price & Interactive Sales Action Module */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          
          {/* Price Row: Prominent Offer Price + Regular Price Struck-Through & Right-aligned Savings */}
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`text-base sm:text-lg font-extrabold font-heading tracking-tight ${isOutOfStock ? 'text-slate-500' : 'text-brand-800'}`}>
                  {formatPrice(currentOfferPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-slate-400 line-through font-normal">
                    {formatPrice(currentRegularPrice)}
                  </span>
                )}
              </div>
            </div>

            {isOutOfStock ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md">
                {isBn ? 'স্টক শেষ' : 'Out of Stock'}
              </span>
            ) : hasDiscount ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                {isBn ? `${formatPrice(savingsAmount)} সাশ্রয়` : `Save ${formatPrice(savingsAmount)}`}
              </span>
            ) : null}
          </div>

          {/* Low Stock Urgency Banner (< 10 items remaining) */}
          {isLowStock && (
            <div className="mb-2 flex items-center justify-between gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/90 text-rose-800 text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="animate-pulse">🔥</span>
                <span>{isBn ? `স্টক সীমিত: মাত্র ${formatNumber(stockAmount)}টি বাকি আছে!` : `Hurry! Only ${stockAmount} remaining!`}</span>
              </span>
            </div>
          )}

          {/* Interactive Sales Buttons: 1-Click Buy Now & Cart Controls */}
          <div className="flex items-center gap-1.5">
            {/* Primary High-Conversion 1-Click Direct Buy Now Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && buyNowDirect(productKey)}
              className={`flex-1 text-xs font-bold py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-brand-700 via-rose-600 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white shadow-xs hover:shadow-brand-800/20 active:scale-95 cursor-pointer'
              }`}
            >
              {isOutOfStock ? (
                <>
                  <span>🚫</span>
                  <span className="whitespace-nowrap">{isBn ? 'স্টক শেষ' : 'Out of Stock'}</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span className="whitespace-nowrap">{isBn ? 'অর্ডার করুন' : 'Order Now'}</span>
                </>
              )}
            </button>

            {/* Cart Controller: Interactive Inline Stepper when In Cart */}
            {currentCartQty > 0 ? (
              <div className="flex items-center bg-brand-50 border border-brand-200 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setProductQty(productKey, currentCartQty - 1)}
                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-brand-800 hover:bg-brand-200/60 rounded-lg text-sm font-bold transition cursor-pointer"
                  title={isBn ? 'পরিমাণ কমান' : 'Decrease'}
                >
                  −
                </button>
                <span className="px-1 text-xs font-black text-brand-900 min-w-[18px] text-center">
                  {currentCartQty}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => !isOutOfStock && addToCart(productKey, 1, true)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-sm font-bold transition ${
                    isOutOfStock 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-brand-800 hover:bg-brand-200/60 cursor-pointer'
                  }`}
                  title={isOutOfStock ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : (isBn ? 'পরিমাণ বাড়ান' : 'Increase')}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  if (!isOutOfStock) {
                    addToCart(productKey, 1, true);
                    openCartDrawer();
                  }
                }}
                className={`p-2 rounded-xl transition flex items-center justify-center ${
                  isOutOfStock
                    ? 'border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'border border-brand-200/90 bg-brand-50 hover:bg-brand-100 text-brand-800 hover:text-brand-900 active:scale-95 cursor-pointer shadow-2xs'
                }`}
                title={isOutOfStock ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : (isBn ? 'কার্টে যোগ করুন' : 'Add to Cart')}
                aria-label={isOutOfStock ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : (isBn ? 'কার্টে যোগ করুন' : 'Add to Cart')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
