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
  const { isBn } = useTranslation();

  const prod = products[productKey];
  if (!prod) return null;

  const isOutOfStock = Boolean(prod.isOutOfStock || prod.stockStatus === 'outofstock' || prod.stockStatus === 'out_of_stock' || prod.stockAmount === 0);

  const currentCartQty = cart[productKey] || 0;
  const currentOfferPrice = Number(prod.price || prod.offerPrice || 0);
  const currentRegularPrice = Number(prod.regularPrice || 0);
  const hasDiscount = currentRegularPrice > currentOfferPrice;
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

  // Pack size extraction from dynamic API fields
  const is30Pcs = productKey.includes('30pcs') || productKey.includes('variety') || productKey === 'combo-26' || (prod.name && prod.name.includes('30'));
  const is20Pcs = productKey.includes('20pcs') || (prod.name && prod.name.includes('20'));
  const packLabel = (isBn ? prod.packSize_bn : prod.packSize) || (is30Pcs 
    ? (isBn ? '৩০ পিস (৩ বক্স কম্বো)' : '30 Pcs (3 Box Combo)')
    : is20Pcs 
    ? (isBn ? '২০ পিস (২ বক্স মেগা প্যাক)' : '20 Pcs (2 Box Mega Pack)')
    : (isBn ? '১০ পিস সিল্ড প্যাক' : '10 Pcs Sealed Pack'));
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
      {/* Top Header Badge & Micro Metadata (Hidden on mobile for clean look, visible on sm+) */}
      <div className="hidden sm:flex px-3 pt-2 pb-1 items-center justify-between text-[11px] gap-2">
        {/* Out of Stock / Discount Ribbon or Brand */}
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1 bg-slate-700 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-2xs tracking-tight">
            <span>🚫</span>
            <span>{isBn ? 'আউট অব স্টক' : 'Out of Stock'}</span>
          </span>
        ) : hasDiscount ? (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-brand-700 to-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-2xs tracking-tight">
            <span>🔥</span>
            <span>{isBn ? `${discountPercent}% ছাড়` : `${discountPercent}% OFF`}</span>
          </span>
        ) : (
          <span className="inline text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {prod.brand || 'MO'}
          </span>
        )}

        {/* Clean Unboxed Metadata: Pack Size & 18+ */}
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 ml-auto sm:ml-0">
          <span className="text-slate-900 font-bold">{packLabel}</span>
          <span aria-hidden="true" className="inline text-slate-400">·</span>
          <span className="inline-block text-emerald-800 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
            {isBn ? '১৮+' : '18+'}
          </span>
        </div>
      </div>

      {/* Visual Product Showcase - 1:1 Aspect Ratio Full Width */}
      <div 
        onClick={() => openProduct(productKey)} 
        className="cursor-pointer relative overflow-hidden bg-white w-full aspect-square flex items-center justify-center border-b border-slate-100"
      >
        <ProductArtwork 
          productKey={productKey} 
          sizeClass="w-full h-full aspect-square"
          imgClassName="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

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
              <div className="flex items-baseline gap-1.5">
                <span className={`text-base sm:text-lg font-extrabold font-heading tracking-tight ${isOutOfStock ? 'text-slate-500' : 'text-brand-800'}`}>
                  {formatPrice(currentOfferPrice)}
                </span>
                {hasDiscount && (
                  <span className="hidden sm:inline text-xs text-slate-500 line-through font-medium">
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
