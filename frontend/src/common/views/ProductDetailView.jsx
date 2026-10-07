import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from '../components/ProductArtwork';
import ProductCard from '../components/ProductCard';
import ProductDetailSkeleton from '../components/ProductDetailSkeleton';
import { trackViewContent } from '../utils/analytics';
import { SITE_CONFIG } from '../config/siteConfig';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl;

export default function ProductDetailView() {
  const selectedSlug = useStore((state) => state.selectedProductSlug);
  const navigateTo = useStore((state) => state.navigateTo);
  const openProduct = useStore((state) => state.openProduct);
  const addToCart = useStore((state) => state.addToCart);
  const addComboToCart = useStore((state) => state.addComboToCart);
  const openCartDrawer = useStore((state) => state.openCartDrawer);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  const fetchProducts = useStore((state) => state.fetchProducts);
  
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);

  const { 
    t, 
    isBn,
    formatPrice, 
    formatNumber, 
    getLocalizedName, 
    getLocalizedTagline, 
    getLocalizedDescription, 
    getLocalizedFeatures 
  } = useTranslation();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

  const product = products[selectedSlug] || 
    (selectedSlug && products[selectedSlug.replace(/-condom$/, '')]) ||
    (selectedSlug && products[`${selectedSlug}-condom`]) ||
    (selectedSlug && Object.values(products).find(p => p.slug === selectedSlug || p.did === selectedSlug || p.id === selectedSlug || p._id === selectedSlug)) ||
    (productKeys.length > 0 && products[productKeys[0]]) || 
    (Object.values(products).length > 0 && Object.values(products)[0]) || 
    null;

  const isOutOfStock = Boolean(product?.isOutOfStock || product?.stockStatus === 'outofstock' || product?.stockStatus === 'out_of_stock' || product?.stockAmount === 0);
  const stockAmount = Number(product?.stockAmount != null ? product.stockAmount : (product?.stock != null ? product.stock : 50));
  const isLowStock = !isOutOfStock && stockAmount > 0 && stockAmount <= 10;

  const currentRegularPrice = Number(product?.price != null ? product.price : (product?.regularPrice || 0));
  const hasOfferPrice = product?.offerPrice != null && !isNaN(Number(product.offerPrice)) && Number(product.offerPrice) > 0 && Number(product.offerPrice) < currentRegularPrice;
  const currentOfferPrice = hasOfferPrice ? Number(product.offerPrice) : currentRegularPrice;

  const hasDiscount = hasOfferPrice;
  const savingsAmount = hasDiscount ? currentRegularPrice - currentOfferPrice : 0;
  const discountPercent = hasDiscount && currentRegularPrice > 0 ? Math.round((savingsAmount / currentRegularPrice) * 100) : 0;

  const localizedName = getLocalizedName(product);
  const localizedTagline = getLocalizedTagline(product);
  const localizedDescription = getLocalizedDescription(product);
  const localizedFeatures = getLocalizedFeatures(product);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (product) {
      trackViewContent(product);
      setSelectedImage(null);
      setQuantity(1);
    }
  }, [product?.id]);

  const resolveImgUrl = (img) => {
    if (!img || typeof img !== 'string') return null;
    const trimmed = img.trim();
    if (!trimmed || trimmed === '#' || trimmed === '/#' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return null;
    }
    const cleanBase = (API_BASE_URL || '').replace(/\/$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const urlObj = new URL(trimmed);
        if ((urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') && urlObj.pathname.startsWith('/uploads')) {
          return cleanBase ? `${cleanBase}${urlObj.pathname}${urlObj.search}` : trimmed;
        }
      } catch (_) {}
      return trimmed;
    }
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
  };

  const primaryCandidate = product?.imageUrl || product?.image_url || product?.featuredImage || product?.featured_image || product?.image || (Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null);

  const galleryImages = (Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (primaryCandidate ? [primaryCandidate] : []))
    .map(resolveImgUrl)
    .filter(Boolean);

  const otherKeys = productKeys.filter((k) => {
    if (k === product?.id || k === product?.slug) return false;
    const p = products[k];
    if (!p) return false;
    const isOut = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
    return !isOut;
  }).slice(0, 4);

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product.id, quantity, false);
    navigateTo('checkout');
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product.id, quantity, true);
    openCartDrawer();
  };

  if (isLoadingProducts && (!product || !product.id)) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center text-4xl shadow-inner">
          🔍
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          {isBn ? 'পণ্যটি খুঁজে পাওয়া যায়নি' : 'Product Not Found'}
        </h2>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition cursor-pointer shadow-md"
          >
            <span>{isBn ? 'সকল পণ্য দেখুন' : 'Browse Products'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  if (!isLoadingProducts && isOutOfStock) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center text-4xl shadow-inner">
          📦
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          {isBn ? 'পণ্যটি বর্তমানে স্টকে নেই' : 'Product Currently Out of Stock'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {isBn
            ? 'দুঃখিত, আপনি যে পণ্যটি দেখছেন তা বর্তমানে আউট অব স্টক রয়েছে। আমাদের স্টকে থাকা অন্যান্য প্রিমিয়াম সামগ্রী দেখতে শপ ভিজিট করুন।'
            : 'Sorry, the product you are looking for is currently out of stock. Please browse our active in-stock collection.'}
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigateTo('shop')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition cursor-pointer shadow-md"
          >
            <span>{isBn ? 'সকল ইন-স্টক পণ্য দেখুন' : 'Browse In-Stock Products'}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <button onClick={() => navigateTo('home')} className="hover:text-brand-700 cursor-pointer">
          {t('product_detail.breadcrumb_home', 'Home')}
        </button>
        <span>/</span>
        <button onClick={() => navigateTo('home')} className="hover:text-brand-700 cursor-pointer">
          {t('product_detail.breadcrumb_products', 'Products')}
        </button>
        <span>/</span>
        <span className="text-slate-900 font-bold">{localizedName}</span>
      </div>

      {/* PRODUCT DETAILS MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Product Large Visual Presentation & Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden aspect-square w-full max-w-md mx-auto relative shadow-xs">
            <ProductArtwork 
              productKey={product} 
              customImageUrl={selectedImage || primaryCandidate}
              sizeClass="w-full h-full aspect-square" 
              imgClassName="w-full h-full object-cover object-center"
            />
            {/* Discount Ribbon Badge */}
            {hasDiscount && discountPercent > 0 && (
              <div 
                className="absolute top-0 left-3 sm:left-4 z-20 pointer-events-none select-none drop-shadow-md"
                title={`${discountPercent}% Discount`}
              >
                <svg 
                  viewBox="0 0 70 65" 
                  className="w-11 sm:w-13 h-auto overflow-visible" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id={`detailDiscountGrad-${product?.id || 'detail'}`} x1="29" y1="0" x2="29" y2="64" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FF0D1B" />
                      <stop offset="45%" stopColor="#EE000A" />
                      <stop offset="100%" stopColor="#C00003" />
                    </linearGradient>
                    <linearGradient id={`detailFoldGrad-${product?.id || 'detail'}`} x1="58" y1="0" x2="70" y2="13" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#B30005" />
                      <stop offset="100%" stopColor="#660002" />
                    </linearGradient>
                  </defs>
                  {/* 3D Fold tab at top right */}
                  <path d="M58 0 C65 0 70 2 70 5 C70 8.5 65 13 58 13 Z" fill={`url(#detailFoldGrad-${product?.id || 'detail'})`} />
                  {/* Main Ribbon Body */}
                  <path d="M4 0 H58 V52 L29 64 L0 52 V4 Q0 0 4 0 Z" fill={`url(#detailDiscountGrad-${product?.id || 'detail'})`} />
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

            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center pointer-events-none z-10">
                <span className="bg-rose-600 text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                  {isBn ? 'আউট অব স্টক' : 'Out of Stock'}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery (If multiple gallery images exist) */}
          {galleryImages && galleryImages.length > 1 && (
            <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin max-w-md mx-auto">
              {galleryImages.map((imgUrl, idx) => {
                const currentActive = selectedImage || galleryImages[0];
                const isSelected = currentActive === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    aria-label={`${localizedName} thumbnail ${idx + 1}`}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer p-0.5 bg-white ${
                      isSelected 
                        ? 'border-brand-700 shadow-xs ring-2 ring-brand-700/20' 
                        : 'border-slate-200 hover:border-brand-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`${localizedName} thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Purchase & Info Column */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {t('brand', 'Brand')}: {product.brand || 'MO'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-slate-900">
              {localizedName}
            </h1>
          </div>

          {/* Price display with Offer Price, Regular Price and Right-aligned Savings Badge */}
          <div className="border-y border-slate-200/80 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
                <div>
                  <span className={`text-3xl sm:text-4xl font-extrabold font-heading ${isOutOfStock ? 'text-slate-500' : 'text-slate-900'}`}>
                    {formatPrice(currentOfferPrice)}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="pl-3 border-l border-slate-200 flex items-baseline self-end mb-1">
                    <span className="text-lg sm:text-xl text-slate-400 line-through font-normal">
                      {formatPrice(currentRegularPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Side: Savings Badge / Out of Stock Badge */}
              <div className="flex-shrink-0">
                {isOutOfStock ? (
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    <span>🚫</span>
                    <span>{isBn ? 'বর্তমানে আউট অব স্টক' : 'Currently Out of Stock'}</span>
                  </span>
                ) : (
                  hasDiscount && (
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs whitespace-nowrap">
                      {isBn 
                        ? `${formatPrice(savingsAmount)} সাশ্রয় (${formatNumber(discountPercent)}% ছাড়)` 
                        : `Save ${formatPrice(savingsAmount)} (${discountPercent}% OFF)`}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Alert Box (< 10 items remaining) */}
          {isLowStock && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-rose-950 leading-snug">
                    {isBn ? `স্টক সীমিত! মাত্র ${formatNumber(stockAmount)}টি বাকি আছে!` : `Limited Stock! Only ${stockAmount} units remaining!`}
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {isBn ? 'স্টক দ্রুত শেষ হচ্ছে, এখনই আপনার অর্ডার নিশ্চিত করুন।' : 'High demand item. Complete your order before it runs out.'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-full shadow-xs whitespace-nowrap">
                {isBn ? `অনলি ${formatNumber(stockAmount)}টি বাকি` : `Only ${stockAmount} left`}
              </span>
            </div>
          )}


          {/* Detailed Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              {t('productDescriptionHeading', 'Product Description')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {localizedDescription}
            </p>
          </div>

          {/* Quantity & Purchase Controls */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-800">{t('quantity', 'Quantity:')}</span>
              <div className={`inline-flex items-center border rounded-xl ${isOutOfStock ? 'border-slate-200 bg-slate-100 opacity-60' : 'border-slate-300 bg-slate-50'}`}>
                <button 
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => !isOutOfStock && setQuantity((q) => Math.max(1, q - 1))} 
                  aria-label="Decrease quantity"
                  className={`px-3 py-2 font-bold text-sm ${isOutOfStock ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 hover:text-slate-950 cursor-pointer'}`}
                >
                  -
                </button>
                <span className="px-4 py-2 text-xs font-bold text-slate-900 bg-white min-w-[2.5rem] text-center">
                  {formatNumber(quantity)}
                </span>
                <button 
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => !isOutOfStock && setQuantity((q) => q + 1)} 
                  aria-label="Increase quantity"
                  className={`px-3 py-2 font-bold text-sm ${isOutOfStock ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800 hover:text-slate-950 cursor-pointer'}`}
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart} 
                aria-label={`${t('addToCart', 'Add to Cart')} - ${localizedName}`}
                className={`w-full text-sm font-bold py-3.5 px-4 rounded-xl border transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-brand-50 hover:bg-brand-100 text-brand-900 border-brand-200 cursor-pointer'
                }`}
              >
                <svg className={`w-4 h-4 ${isOutOfStock ? 'text-slate-400' : 'text-brand-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>{isOutOfStock ? (isBn ? 'স্টক শেষ' : 'Out of Stock') : t('addToCart', 'Add to Cart')}</span>
              </button>
              <button 
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow} 
                aria-label={`${t('buyNow', 'Buy Now')} - ${localizedName}`}
                className={`w-full text-sm font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                    : 'bg-brand-700 hover:bg-brand-800 text-white shadow-md cursor-pointer'
                }`}
              >
                <span>{isOutOfStock ? (isBn ? 'স্টক শেষ (অর্ডার বন্ধ)' : 'Out of Stock') : t('buyNow', 'Buy Now')}</span>
                {!isOutOfStock && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Discreet Packaging Box */}
          <div className="bg-brand-50/50 border border-brand-100 p-3.5 rounded-xl flex items-center gap-3 text-xs text-slate-700">
            <svg className="w-5 h-5 text-brand-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>
              <strong className="font-bold text-slate-900">{t('discreetAssuranceLabel', 'Discreet Assurance:')}</strong> {t('discreetAssuranceText', 'Shipped in completely unmarked, unprinted parcel bags. Zero personal wellness labels on outer packaging.')}
            </span>
          </div>

          {/* Optional Subtle Combo Recommendation */}
          {!product.slug?.includes('combo') && (() => {
            const activeCombos = Object.values(products).filter(p => {
              if (!p || p.isActive === false) return false;
              const isOut = Boolean(p.isOutOfStock || p.stockStatus === 'outofstock' || p.stockStatus === 'out_of_stock' || p.stockAmount === 0);
              if (isOut) return false;
              return p.categorySlug === 'combo' || (p.slug && p.slug.includes('combo')) || (p.name && p.name.toLowerCase().includes('combo'));
            }).slice(0, 2);

            if (activeCombos.length === 0) return null;

            return (
              <div className="pt-1 text-xs text-slate-600 flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-500">
                  {isBn ? '💡 বেশি সাশ্রয়ে কম্বো প্যাক খুঁজছেন?' : '💡 Looking for value combo packs?'}
                </span>
                {activeCombos.map((cProd, idx) => {
                  const cKey = cProd.slug || cProd.id;
                  const cPrice = cProd.offerPrice || cProd.price;
                  const cName = isBn ? (cProd.name_bn || cProd.name) : cProd.name;
                  return (
                    <React.Fragment key={cKey}>
                      {idx > 0 && <span className="text-slate-300">•</span>}
                      <button
                        type="button"
                        onClick={() => openProduct(cKey)}
                        className="text-brand-700 hover:text-brand-900 font-bold underline cursor-pointer"
                      >
                        {cPrice ? `${cName} (${formatPrice(cPrice)})` : cName}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}

        </div>
      </div>

      {/* FULL PRODUCT DETAILS & TECHNICAL SPECIFICATIONS SECTION (ABOVE OTHER PRODUCTS) */}
      {(() => {
        const rawSpecs = (isBn ? product.specifications_bn : product.specifications) || product.specifications || product.technicalSpecs || {};
        let specsObj = {};
        if (Array.isArray(rawSpecs)) {
          rawSpecs.forEach((entry) => {
            if (entry && typeof entry === 'object') {
              const k = entry.key || entry.label || entry.name;
              const v = entry.value || entry.val || entry.content;
              if (k && v != null) specsObj[k] = v;
            }
          });
        } else if (rawSpecs && typeof rawSpecs === 'object') {
          specsObj = rawSpecs;
        }
        const entries = Object.entries(specsObj);
        const hasSpecs = entries.length > 0;

        const activeBenefits = (isBn ? product.benefits_bn : product.benefits) || product.benefits || [];
        const hasBenefits = Array.isArray(activeBenefits) && activeBenefits.length > 0;
        const hasFeatures = Array.isArray(localizedFeatures) && localizedFeatures.length > 0;
        const hasRightSide = hasBenefits || hasFeatures;

        if (!hasSpecs && !hasRightSide) return null;

        return (
          <div className="pt-8 border-t border-slate-200/90 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900">
                {isBn ? 'পণ্যের বিস্তারিত স্পেসিফিকেশন' : 'Product Details & Specifications'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isBn ? 'পণ্যের গুণগত বৈশিষ্ট্য ও বিস্তারিত বিবরণ' : 'Detailed product characteristics and quality specifications'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Technical Specifications */}
              {hasSpecs && (
                <div className={`${hasRightSide ? 'lg:col-span-6' : 'lg:col-span-12'} bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
                      <span>{t('specs_title', 'Technical & Quality Specifications')}</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {entries.map(([label, val], idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                        <span className="text-[11px] text-slate-600 block font-semibold">{label}:</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Features & Benefits */}
              {hasRightSide && (
                <div className={`${hasSpecs ? 'lg:col-span-6' : 'lg:col-span-12'} bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-4`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>{isBn ? 'মূল বৈশিষ্ট্য ও সুবিধাসমূহ' : 'Key Characteristics & Benefits'}</span>
                  </h3>

                  {hasBenefits ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-800">
                      {activeBenefits.map((b, idx) => {
                        const title = typeof b === 'object' ? (b.title || '') : b;
                        const desc = typeof b === 'object' ? (b.desc || b.description || '') : '';
                        return (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs text-left">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span className="text-brand-700">✓</span>
                              <span>{title}</span>
                            </div>
                            {desc && <p className="text-[11px] text-slate-700 mt-1 leading-relaxed font-normal">{desc}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-800">
                      {localizedFeatures.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                          <span className="text-brand-700 font-bold">✓</span>
                          <span className="font-semibold text-slate-900">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* DYNAMIC SECTIONS & FAQS (New Schema Support) */}
      {(() => {
        const activeSections = (isBn ? product.sections_bn : product.sections) || product.sections || [];
        const activeFaqs = (isBn ? product.faqs_bn : product.faqs) || product.faqs || [];

        const validSections = Array.isArray(activeSections) ? activeSections.filter(Boolean) : [];
        const validFaqs = Array.isArray(activeFaqs) ? activeFaqs.filter(Boolean) : [];

        if (validSections.length === 0 && validFaqs.length === 0) return null;

        return (
          <div className="pt-8 border-t border-slate-200/90 space-y-8">
            {/* Custom Content Sections */}
            {validSections.length > 0 && (
              <div className="space-y-6">
                {validSections.map((sec, idx) => {
                  const title = typeof sec === 'object' ? (sec.title || sec.heading || '') : '';
                  const content = typeof sec === 'object' ? (sec.content || sec.body || sec.text || sec.description || '') : String(sec);
                  if (!title && !content) return null;
                  return (
                    <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-2 text-left">
                      {title && (
                        <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                          {title}
                        </h3>
                      )}
                      {content && (
                        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product FAQs */}
            {validFaqs.length > 0 && (
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                    {isBn ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions (FAQ)'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {validFaqs.map((faq, idx) => {
                    const q = typeof faq === 'object' ? (faq.question || faq.q || faq.title || '') : '';
                    const a = typeof faq === 'object' ? (faq.answer || faq.a || faq.content || '') : String(faq);
                    if (!q && !a) return null;
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs space-y-1.5 text-left">
                        {q && (
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                            <span className="text-brand-700 font-extrabold">Q:</span>
                            <span>{q}</span>
                          </h4>
                        )}
                        {a && (
                          <p className="text-xs text-slate-600 pl-5 leading-relaxed">
                            {a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ADD MORE PRODUCTS (AFTER PRODUCT) */}
      {otherKeys.length > 0 && (
        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-lg font-heading font-bold text-slate-900">
                {t('addComplementaryHeading', 'Add Complementary Products')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('addComplementarySubtitle', 'Combine multiple products together in one discreet shipment.')}
              </p>
            </div>
            <button 
              type="button"
              onClick={addComboToCart} 
              className="text-xs sm:text-sm font-bold bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              {isBn ? `স্পেশাল অফারটি লুফে নিন →` : `Grab the special offer →`}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {otherKeys.map((k) => (
              <ProductCard key={k} productKey={k} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
