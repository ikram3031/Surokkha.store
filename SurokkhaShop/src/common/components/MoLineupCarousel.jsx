import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { isMoProduct } from '../utils/moProducts';

const PAGE_SIZE = 8; // 2 rows: 4 per row on desktop, 2 per row on mobile (4 rows)
const MAX_ITEMS = 12; // more than 8 products spill onto a second page, capped at 12

const GRID_CLASS = 'grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 content-start';

// Carousel of every MO-brand product, a full row of cards per page, arrows on the sides.
const MoLineupCarousel = () => {
  const products = useStore((s) => s.products);
  const productKeys = useStore((s) => s.productKeys);
  const isLoadingProducts = useStore((s) => s.isLoadingProducts);

  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const keys = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const key of productKeys || []) {
      const p = products[key];
      if (!p || p.isActive === false || p.status === 'inactive') continue;
      if (p.itemType === 'item' || p.type === 'item' || p.entityType === 'item') continue;
      if (!isMoProduct(p, key)) continue;
      const id = p.did || p.slug || p._id || key;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(key);
    }
    return out;
  }, [productKeys, products]);

  const pages = useMemo(() => {
    const list = keys.slice(0, MAX_ITEMS);
    const out = [];
    for (let i = 0; i < list.length; i += PAGE_SIZE) out.push(list.slice(i, i + PAGE_SIZE));
    return out;
  }, [keys]);

  const [pageIdx, setPageIdx] = useState(0);

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    setPageIdx(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [pages.length, isLoadingProducts]);

  const page = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const arrow = (dir, enabled) => (
    <button
      type="button"
      onClick={() => page(dir)}
      disabled={!enabled}
      aria-label={dir < 0 ? 'Previous products' : 'Next products'}
      className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 ${dir < 0 ? '-left-5' : '-right-5'} z-10 w-10 h-10 rounded-full items-center justify-center bg-white border border-slate-200 text-slate-700 shadow-md transition cursor-pointer hover:bg-rose-50 hover:text-brand-700 active:scale-95 ${enabled ? '' : 'opacity-0 pointer-events-none'}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={dir < 0 ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );

  return (
    <div className="relative">
      {pages.length > 1 && arrow(-1, canLeft)}
      {pages.length > 1 && arrow(1, canRight)}
      <div
        ref={scrollRef}
        onScroll={update}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoadingProducts ? (
          <div className={`${GRID_CLASS} w-full flex-shrink-0 snap-start`}>
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`mo-skel-${i}`} />)}
          </div>
        ) : (
          pages.map((pageKeys, i) => (
            <div key={`mo-page-${i}`} className={`${GRID_CLASS} w-full flex-shrink-0 snap-start`}>
              {pageKeys.map((key) => <ProductCard key={`mo-${key}`} productKey={key} className="h-full" />)}
            </div>
          ))
        )}
      </div>
      {!isLoadingProducts && pages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              onClick={() => scrollRef.current?.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: 'smooth' })}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${pageIdx === i ? 'w-6 bg-brand-700' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MoLineupCarousel;
