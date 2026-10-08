import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductArtwork from './ProductArtwork';

export default function CartDrawer() {
  const isCartDrawerOpen = useStore((state) => state.isCartDrawerOpen);
  const closeCartDrawer = useStore((state) => state.closeCartDrawer);
  const cart = useStore((state) => state.cart);
  const products = useStore((state) => state.products);
  const setProductQty = useStore((state) => state.setProductQty);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const navigateTo = useStore((state) => state.navigateTo);
  const openProduct = useStore((state) => state.openProduct);
  const addComboToCart = useStore((state) => state.addComboToCart);
  const applyCoupon = useStore((state) => state.applyCoupon);
  const removeCoupon = useStore((state) => state.removeCoupon);
  const appliedCoupon = useStore((state) => state.appliedCoupon);
  const isApplyingCoupon = useStore((state) => state.isApplyingCoupon);
  const couponError = useStore((state) => state.couponError);

  const { isBn, t, formatNumber } = useTranslation();
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [isRendered, setIsRendered] = useState(isCartDrawerOpen);
  const [isVisible, setIsVisible] = useState(isCartDrawerOpen);
  const drawerRef = useRef(null);

  // Smooth Entry / Exit Animation Controller
  useEffect(() => {
    let timeoutId;
    if (isCartDrawerOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      timeoutId = setTimeout(() => {
        setIsRendered(false);
      }, 320); // 320ms transition duration
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isCartDrawerOpen]);

  const totals = getCartTotals();
  const effectiveCoupon = totals.appliedCoupon || appliedCoupon;
  const cartKeys = Object.keys(cart).filter((k) => cart[k] > 0);
  const hasComboInCart = cartKeys.some(
    (k) => k.includes('combo') || k === 'variety-condoms-30pcs-combo' || k === 'combo-26'
  );
  
  const comboProd = Object.values(products).find(p => {
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
  }) || products['variety-condoms-30pcs-combo'] || products['mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'] || products['combo-26'];

  const isComboInStock = Boolean(comboProd && !comboProd.isOutOfStock && comboProd.stockStatus !== 'outofstock' && comboProd.stockStatus !== 'out_of_stock' && comboProd.stockAmount !== 0);
  const comboOfferPrice = Number(comboProd?.offerPrice || comboProd?.price || 0);
  const comboRegularPrice = Number(comboProd?.regularPrice || comboOfferPrice);
  const comboSavings = comboRegularPrice > comboOfferPrice ? comboRegularPrice - comboOfferPrice : 0;

  const freeDeliveryThreshold = 1000;
  const progressPercent = Math.min(100, Math.round((totals.subtotal / freeDeliveryThreshold) * 100));
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - totals.subtotal);

  // Format price helper
  const formatPrice = (val) => {
    const num = Number(val) || 0;
    if (isBn) {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return '৳' + String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
    }
    return `৳${num}`;
  };

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isRendered) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRendered]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartDrawerOpen) {
        closeCartDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartDrawerOpen, closeCartDrawer]);

  const handleCheckout = () => {
    closeCartDrawer();
    navigateTo('checkout');
  };

  const handleBrowseShop = () => {
    closeCartDrawer();
    navigateTo('shop');
  };

  const handleItemClick = (slug) => {
    closeCartDrawer();
    openProduct(slug);
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const res = await applyCoupon(couponCodeInput.trim());
    if (res.success) {
      setCouponFeedback({ type: 'success', message: res.message });
      setCouponCodeInput('');
    } else {
      setCouponFeedback({ type: 'error', message: res.message });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback(null);
  };

  if (!isRendered) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] overflow-hidden select-none transition-colors duration-300 ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      }`} 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop Overlay with Smooth Fade */}
      <div 
        onClick={closeCartDrawer}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer Container with Smooth Slide-in / Slide-out */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-[101] pointer-events-none">
        <div 
          ref={drawerRef}
          className={`w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-slate-200 pointer-events-auto ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          
          {/* 1. DRAWER HEADER */}
          <div className="px-5 py-4 sm:py-5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center text-lg font-bold shadow-2xs">
                🛒
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900 leading-tight">
                  {isBn ? 'আপনার শপিং কার্ট' : 'Shopping Cart'}
                </h2>
                <span className="text-xs text-slate-600">
                  {isBn ? `${totals.itemCount}টি আইটেম যোগ করা হয়েছে` : `${totals.itemCount} items in cart`}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeCartDrawer}
              aria-label="Close Cart Drawer"
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200 active:scale-95"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 2. FREE DELIVERY THRESHOLD BAR */}
          {cartKeys.length > 0 && (
            <div className="bg-emerald-50/90 border-b border-emerald-200/80 px-5 py-3 flex-shrink-0">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>🚚</span>
                  {totals.subtotal >= freeDeliveryThreshold ? (
                    <span className="text-emerald-800 font-black">
                      {isBn ? '🎉 অভিনন্দন! আপনি ফ্রি হোম ডেলিভারি পাচ্ছেন!' : '🎉 Congratulations! You unlocked Free Home Delivery!'}
                    </span>
                  ) : (
                    <span>
                      {isBn ? (
                        <>
                          আর মাত্র <strong className="text-emerald-900 underline font-black">{formatPrice(remainingForFreeDelivery)}</strong> টাকার পণ্য যোগ করলেই <strong className="text-emerald-900">ফ্রি ডেলিভারি!</strong>
                        </>
                      ) : (
                        <>
                          Add <strong className="text-emerald-900 font-black">{formatPrice(remainingForFreeDelivery)}</strong> more for <strong className="text-emerald-900">Free Delivery!</strong>
                        </>
                      )}
                    </span>
                  )}
                </span>
                <span className="font-bold text-emerald-800 text-[11px] font-mono">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-emerald-200/80 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* 3. DRAWER BODY (Scrollable Items) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {cartKeys.length === 0 ? (
              /* EMPTY STATE */
              <div className="py-12 sm:py-16 text-center space-y-4 px-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-800 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-rose-100">
                  🛍️
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-heading font-bold text-slate-900">
                    {isBn ? 'আপনার কার্ট বর্তমানে খালি' : 'Your cart is empty'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                    {isBn 
                      ? 'অর্ডার করতে আপনার পছন্দসই আসল MO পার্সোনাল কেয়ার পণ্য কার্টে যোগ করুন।'
                      : 'Explore our authentic MO lineup and add items to your cart.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={handleBrowseShop}
                    className="w-full bg-gradient-to-r from-brand-700 via-rose-600 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white text-xs sm:text-sm font-bold py-3.5 px-6 rounded-2xl shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isBn ? '🛍️ প্রোডাক্ট ব্রাউজ করুন' : '🛍️ Browse Products'}</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      addComboToCart();
                    }}
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 text-xs sm:text-sm font-bold py-3 px-4 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>
                      🔥 {isBn 
                        ? (comboOfferPrice > 0 ? `মেগা কম্বো প্যাক যোগ করুন (${formatPrice(comboOfferPrice)})` : 'মেগা কম্বো প্যাক যোগ করুন') 
                        : (comboOfferPrice > 0 ? `Add Mega Combo Pack (${formatPrice(comboOfferPrice)})` : 'Add Mega Combo Pack')}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* CART ITEMS LIST */
              <div className="space-y-3.5">
                {cartKeys.map((cartKey) => {
                  const parts = cartKey.split(':::');
                  const baseSlug = parts[0];
                  const variantName = parts[1];
                  const baseItem = products[baseSlug] || { name: baseSlug, price: 0, regularPrice: 0 };
                  const variant = variantName && baseItem.variants ? baseItem.variants.find(v => v.size === variantName) : null;
                  const item = variant ? { 
                    ...baseItem, 
                    name: baseItem.name + ' (' + variantName + ')', 
                    name_bn: (baseItem.name_bn || baseItem.name) + ' (' + variantName + ')', 
                    price: Number(variant.offerPrice > 0 ? variant.offerPrice : (variant.price || variant.regularPrice || baseItem.price || 0)), 
                    regularPrice: Number(variant.regularPrice > 0 ? variant.regularPrice : (variant.price || baseItem.regularPrice || 0)),
                    imageUrl: variant.imageUrl || baseItem.imageUrl 
                  } : baseItem;
                  const slug = baseSlug;
                  const qty = cart[cartKey];
                  const lineTotal = item.price * qty;

                  return (
                    <div 
                      key={cartKey} 
                      className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs hover:border-slate-300 transition flex items-center gap-3.5 relative"
                    >
                      {/* Product Thumbnail */}
                      <button
                        type="button"
                        onClick={() => handleItemClick(slug)}
                        className="w-16 h-18 bg-slate-50 rounded-xl p-1 flex items-center justify-center flex-shrink-0 border border-slate-200/80 overflow-hidden cursor-pointer hover:opacity-90"
                      >
                        <ProductArtwork productKey={item} customImageUrl={item?.imageUrl} sizeClass="w-full h-full" />
                      </button>

                      {/* Details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <button
                          type="button"
                          onClick={() => handleItemClick(slug)}
                          className="text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-brand-800 transition line-clamp-2 leading-snug cursor-pointer"
                        >
                          {item.name_bn || item.name}
                        </button>

                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs sm:text-sm font-extrabold text-rose-700 font-heading">
                            {formatPrice(item.price)}
                          </span>
                          {item.regularPrice > item.price && (
                            <span className="text-[11px] text-slate-500 line-through font-medium">
                              {formatPrice(item.regularPrice)}
                            </span>
                          )}
                        </div>

                        {/* Low Stock Scarcity Tag */}
                        {(() => {
                          const stockAmount = Number(item.stockAmount != null ? item.stockAmount : (item.stock != null ? item.stock : 50));
                          const isLowStock = !item.isOutOfStock && stockAmount > 0 && stockAmount <= 10;
                          if (!isLowStock) return null;
                          return (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/70 w-fit animate-pulse">
                              <span>🔥</span>
                              <span>{isBn ? `স্টকে মাত্র ${formatNumber(stockAmount)}টি বাকি আছে!` : `Only ${stockAmount} left in stock!`}</span>
                            </div>
                          );
                        })()}

                        {/* Quantity Stepper & Subtotal in-row */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="inline-flex items-center border border-slate-200 rounded-xl bg-slate-50 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setProductQty(cartKey, qty - 1)}
                              className="px-2.5 py-1 text-slate-800 hover:text-slate-950 hover:bg-slate-200/60 rounded-l-xl font-bold text-sm cursor-pointer transition"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-white font-mono min-w-[24px] text-center">
                              {formatNumber(qty)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setProductQty(cartKey, qty + 1)}
                              className="px-2.5 py-1 text-slate-800 hover:text-slate-950 hover:bg-slate-200/60 rounded-r-xl font-bold text-sm cursor-pointer transition"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button (Red Top-Right) */}
                      <button
                        type="button"
                        onClick={() => setProductQty(cartKey, 0)}
                        title={t('cart.remove', 'মুছে ফেলুন')}
                        aria-label={t('cart.remove', 'Remove Item')}
                        className="absolute top-2.5 right-2.5 text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80 p-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}

                {/* Add More Products Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleBrowseShop}
                    className="w-full text-xs font-bold text-brand-800 hover:text-brand-900 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/80 py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>+ {isBn ? 'আরও প্রোডাক্ট যোগ করুন' : 'Add More Products'}</span>
                  </button>
                </div>

                {/* Optional Combo Nudge if combo is not in cart and in stock */}
                {!hasComboInCart && isComboInStock && (
                  <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3.5 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded uppercase">
                        🔥 {isBn ? 'মেগা সেভার' : 'Mega Saver'}
                      </span>
                      {comboSavings > 0 && (
                        <span className="text-[11px] text-amber-800 font-extrabold">{formatPrice(comboSavings)} {isBn ? 'সাশ্রয়' : 'Savings'}</span>
                      )}
                    </div>
                    <p className="text-xs text-amber-950 font-medium leading-tight">
                      {isBn 
                        ? (comboOfferPrice > 0 ? `৩টি MO ভ্যারিয়েন্ট একসাথে নিন মাত্র ${formatPrice(comboOfferPrice)} টাকায়!` : '৩টি MO ভ্যারিয়েন্ট একসাথে নিন বিশেষ ছাড়ে!') 
                        : (comboOfferPrice > 0 ? `Get 3 MO Packs Together for only ${formatPrice(comboOfferPrice)}!` : 'Get 3 MO Packs Together with Special Savings!')}
                    </p>
                    <button
                      type="button"
                      onClick={() => addComboToCart(comboProd?.slug || comboProd?.id)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-2 px-3 rounded-xl transition cursor-pointer shadow-xs active:scale-98"
                    >
                      {isBn 
                        ? (comboOfferPrice > 0 ? `কম্বো যোগ করুন (${formatPrice(comboOfferPrice)})` : 'কম্বো যোগ করুন') 
                        : (comboOfferPrice > 0 ? `Add 3-Pack Combo (${formatPrice(comboOfferPrice)})` : 'Add 3-Pack Combo')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. DRAWER FOOTER (Order Summary & Checkout Button) */}
          {cartKeys.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/95 space-y-3.5 flex-shrink-0">
              
              {/* Coupon Code Section */}
              <div className="space-y-1.5">
                {effectiveCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-800 font-bold">🎟️ {effectiveCoupon.code}</span>
                      <span className="text-emerald-900 font-extrabold font-mono">
                        {effectiveCoupon.discountType === 'free_shipping'
                          ? `(${isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery'})`
                          : `(-${formatPrice(totals.discountAmount)})`}
                      </span>
                      {effectiveCoupon.isAutoApplied && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                          {isBn ? 'স্বয়ংক্রিয়' : 'Auto'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs underline cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder={isBn ? 'কুপন কোড লিখুন...' : 'Enter coupon code...'}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponCodeInput.trim()}
                      className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
                    >
                      {isApplyingCoupon ? '...' : (isBn ? 'প্রয়োগ' : 'Apply')}
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <p className={`text-[11px] font-medium ${couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>{isBn ? 'আইটেম সাবটোটাল' : 'Subtotal'} ({totals.itemCount} {isBn ? 'টি' : 'items'})</span>
                  <span className="font-bold text-slate-900 font-mono">৳{totals.subtotal}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{isBn ? 'কুপন ডিসকাউন্ট' : 'Coupon Discount'}</span>
                    <span className="font-mono">-৳{totals.discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700 font-medium">
                  <span>{isBn ? 'ডেলিভারি চার্জ' : 'Delivery Charge'}</span>
                  <span>
                    {totals.isFreeShippingCoupon || totals.subtotal >= freeDeliveryThreshold ? (
                      <strong className="text-emerald-700 font-bold uppercase">{isBn ? 'ফ্রি' : 'FREE'}</strong>
                    ) : (
                      <span className="text-[11px] text-slate-600 font-medium">
                        {isBn ? 'চেকআউটে নির্ধারিত হবে' : 'Calculated at checkout'}
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">{isBn ? 'সর্বমোট প্রদেয়' : 'Estimated Total'}</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-brand-800 font-mono">
                    ৳{totals.grandTotal}
                  </span>
                </div>
              </div>

              {/* Primary Checkout CTA Button */}
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-brand-700 via-rose-600 to-brand-800 hover:from-brand-800 hover:to-brand-900 text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-brand-800/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isBn ? '✓ সরাসরি চেকআউট করুন' : '✓ Proceed to Checkout'}</span>
                <span>({formatPrice(totals.grandTotal)})</span>
                <span>→</span>
              </button>

              {/* Reassurance Footer */}
              <p className="text-[11px] text-slate-700 font-medium text-center flex items-center justify-center gap-1.5 pt-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>{isBn ? '১০০% গোপনীয় আনলেবেলড পার্সেল • ক্যাশ অন ডেলিভারি' : '100% Discreet Packaging • Cash on Delivery'}</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
