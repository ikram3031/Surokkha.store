import React, { useState } from 'react';
import { ShoppingBag, Check, Eye, Zap } from 'lucide-react';
import { formatPrice, toBengaliNumber } from '../utils/formatters';
import { useCartStore } from '../store/useCartStore';

export const ProductCard = ({ product, onOpenModal }) => {
  const { addToCart } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const regularPrice = product.regularPrice || product.price || 0;
  const offerPrice = product.offerPrice || product.price || 0;
  const discount = product.discountPercentage > 0
    ? product.discountPercentage
    : (regularPrice > offerPrice ? Math.round(((regularPrice - offerPrice) / regularPrice) * 100) : 0);

  const hasVariants = product.type === 'variant' && Array.isArray(product.variants) && product.variants.length > 0;
  let minPrice = offerPrice;
  let maxPrice = offerPrice;
  if (hasVariants) {
    const prices = product.variants.map(v => Number(v.offerPrice || v.price || v.regularPrice || 0)).filter(p => p > 0);
    if (prices.length > 0) {
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }
  }

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (product.isOutOfStock) return;

    if (hasVariants) {
      onOpenModal(product);
      return;
    }

    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1600);
  };

  return (
    <div
      onClick={() => onOpenModal(product)}
      className="group relative flex flex-col bg-slate-800/80 hover:bg-slate-850 border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Product Image Area */}
      <div className="relative w-full pt-[90%] sm:pt-[95%] bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
        {/* Badges Container */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-1 pointer-events-none">
          {/* Discount Badge */}
          {discount > 0 ? (
            <span className="bg-rose-600/95 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm">
              -{toBengaliNumber(discount)}% ছাড়
            </span>
          ) : <span />}

          {/* Stock Badge */}
          {product.isOutOfStock ? (
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
              স্টক আউট
            </span>
          ) : (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-ping"></span>
              স্টকে আছে
            </span>
          )}
        </div>

        {/* Product Image */}
        <div className="absolute inset-0 p-3 sm:p-4 flex items-center justify-center">
          {!imageError && product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-2 bg-slate-900/40 rounded-xl">
              <ShoppingBag className="w-10 h-10 mb-1 text-slate-600" />
              <span className="text-[11px] font-medium text-slate-400 line-clamp-2">{product.name}</span>
            </div>
          )}
        </div>

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="bg-slate-900/90 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg flex items-center space-x-1 backdrop-blur-sm">
            <Eye className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            <span>বিস্তারিত দেখুন</span>
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="flex-1 flex flex-col p-3 sm:p-4">
        {/* Category & Brand pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="font-semibold text-emerald-400 tracking-wide">
            {product.category_name || product.brand}
          </span>
          {product.brand && (
            <span className="text-slate-400 text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded">
              {product.brand}
            </span>
          )}
        </div>

        {/* Explicit Real Product Title */}
        <h3 className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>

        {/* Bangla Subtitle / Pack Size */}
        <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 mt-1">
          {product.packSize || product.name_bn || product.tagline}
        </p>

        {/* Price Section */}
        <div className="mt-auto pt-3 flex items-baseline justify-between gap-1">
          <div className="flex items-baseline space-x-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
              {hasVariants ? (minPrice !== maxPrice ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}` : formatPrice(minPrice)) : formatPrice(offerPrice)}
            </span>
            {regularPrice > offerPrice && (
              <span className="text-xs sm:text-sm text-slate-400 line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>

          {discount > 0 && (
            <span className="text-[10px] font-bold text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 hidden sm:inline">
              বাঁচবে {formatPrice(regularPrice - offerPrice)}
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        <div className="mt-3 pt-2 border-t border-slate-700/60">
          <button
            onClick={handleQuickAdd}
            disabled={product.isOutOfStock}
            className={`w-full py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all duration-200 active:scale-95 ${
              product.isOutOfStock
                ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-white animate-bounce" />
                <span>কার্টে যোগ হয়েছে</span>
              </>
            ) : product.isOutOfStock ? (
              <span>স্টক শেষ</span>
            ) : hasVariants ? (
              <>
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                <span>বাছাই করুন</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
                <span>অর্ডার / কার্টে যোগ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
