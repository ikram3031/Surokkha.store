import React, { useRef, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

// Renders the curated wellness and lubricant product carousel
const ProductCarousel = ({ maxItems = 10 }) => {
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);
  const isLoadingProducts = useStore((state) => state.isLoadingProducts);
  const navigateTo = useStore((state) => state.navigateTo);
  const { t, isBn } = useTranslation();

  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const randomizedNonComboKeys = useMemo(() => {
    if (!productKeys || productKeys.length === 0) return [];

    const seenIds = new Set();
    const nonCombos = [];

    for (const key of productKeys) {
      const p = products[key];
      if (!p) continue;

      const isCombo = 
        (p.category && String(typeof p.category === 'object' ? p.category.name : p.category).toLowerCase().includes('combo')) ||
        (p.category_bn && p.category_bn.includes('কম্বো')) ||
        (p.categorySlug && p.categorySlug.toLowerCase().includes('combo')) ||
        (key.toLowerCase().includes('combo')) ||
        (p.name && p.name.toLowerCase().includes('combo'));

      if (isCombo) continue;

      const isContraceptive = 
        (p.category && (
          String(typeof p.category === 'object' ? (p.category.name || p.category.slug || '') : p.category).toLowerCase().includes('contraceptive') ||
          String(typeof p.category === 'object' ? (p.category.name || p.category.slug || '') : p.category).toLowerCase().includes('condom')
        )) ||
        (p.category_bn && (
          p.category_bn.includes('কনট্রাসেপটিভ') ||
          p.category_bn.includes('কন্ট্রাসেপটিভ') ||
          p.category_bn.includes('কনডম') ||
          p.category_bn.includes('পরিবার পরিকল্পনা')
        )) ||
        (p.categorySlug && (
          p.categorySlug.toLowerCase().includes('contraceptive') ||
          p.categorySlug.toLowerCase().includes('condom')
        )) ||
        (Array.isArray(p.categories) && p.categories.some((c) => {
          const val = String(typeof c === 'object' ? (c.name || c.slug || '') : c).toLowerCase();
          return val.includes('contraceptive') || val.includes('condom') || val.includes('কনডম') || val.includes('কনট্রাসেপটিভ') || val.includes('পরিবার পরিকল্পনা');
        })) ||
        (key.toLowerCase().includes('contraceptive') || key.toLowerCase().includes('condom')) ||
        (p.slug && (p.slug.toLowerCase().includes('contraceptive') || p.slug.toLowerCase().includes('condom')));

      if (isContraceptive) continue;

      const uniqueId = p.did || p.slug || p._id || key;
      if (seenIds.has(uniqueId)) continue;
      seenIds.add(uniqueId);

      nonCombos.push(key);
    }

    const shuffled = [...nonCombos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, maxItems);
  }, [productKeys, products, maxItems]);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const firstChild = el.firstElementChild;
    const cardWidth = firstChild ? firstChild.clientWidth + 20 : 300;
    const scrollAmount = cardWidth * 1.5;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  React.useEffect(() => {
    if (isPaused || randomizedNonComboKeys.length <= 1) return;

    const interval = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const el = scrollContainerRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const firstChild = el.firstElementChild;
        const step = firstChild ? firstChild.clientWidth + 20 : 290;
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [isPaused, randomizedNonComboKeys.length]);

  if (!isLoadingProducts && randomizedNonComboKeys.length === 0) {
    return null;
  }

  return (
    <section 
      id="otherProductsSection" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xs">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-left max-w-xl">
            <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/70 inline-flex items-center gap-1.5 shadow-2xs">
              <span>✨</span>
              <span>{isBn ? 'জনপ্রিয় কালেকশন' : 'Featured Selection'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-slate-900 mt-2.5">
              {isBn ? 'অন্যান্য ওয়েলনেস ও সুরক্ষা প্রোডাক্টস' : 'Explore Wellness & Care Products'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              {isBn 
                ? 'আপনার পছন্দ অনুযায়ী বাছাইকৃত প্রিমিয়াম পার্সোনাল লুব্রিকেন্ট ও ওয়েলনেস কেয়ার সামগ্রী।'
                : 'Browse our curated collection of personal wellness and lubricant products.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('shop')}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 hover:underline underline-offset-4 mr-2 transition cursor-pointer"
            >
              {isBn ? 'সব প্রোডাক্ট দেখুন →' : 'View All →'}
            </button>
            
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                canScrollLeft 
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-brand-700 hover:border-brand-300 shadow-xs active:scale-95' 
                  : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                canScrollRight 
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-brand-700 hover:border-brand-300 shadow-xs active:scale-95' 
                  : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={checkScrollability}
          className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 px-1 -mx-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoadingProducts ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div 
                key={`carousel-skeleton-${idx}`} 
                className="snap-start flex-shrink-0 w-[240px] sm:w-[270px] md:w-[290px]"
              >
                <ProductCardSkeleton />
              </div>
            ))
          ) : (
            randomizedNonComboKeys.map((key) => (
              <div 
                key={`carousel-item-${key}`} 
                className="snap-start flex-shrink-0 w-[240px] sm:w-[270px] md:w-[290px]"
              >
                <ProductCard productKey={key} className="h-full" />
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
};

export default ProductCarousel;
