import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';
import { isMoProduct } from '../utils/moProducts';

// MO combos left out of the lineup (matched by slug prefix or combo category)
const EXCLUDED_SLUG_PREFIXES = [
  '30-pieces',
  'mo-combo',
  'care-combo',
];

const isExcluded = (p, key) => {
  const slug = String(p?.slug || key || '').toLowerCase();
  if (p?.categorySlug === 'combo' || slug.includes('combo')) return true;
  return EXCLUDED_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));
};

const GRID_CLASS = 'grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 content-start';

// Every MO-brand product except the combos above, shown together in one grid (no carousel)
const MoLineupCarousel = () => {
  const products = useStore((s) => s.products);
  const productKeys = useStore((s) => s.productKeys);
  const isLoadingProducts = useStore((s) => s.isLoadingProducts);

  const keys = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const key of productKeys || []) {
      const p = products[key];
      if (!p || p.isActive === false || p.status === 'inactive') continue;
      if (p.itemType === 'item' || p.type === 'item' || p.entityType === 'item') continue;
      if (!isMoProduct(p, key) || isExcluded(p, key)) continue;
      const id = p.did || p.slug || p._id || key;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(key);
    }
    return out;
  }, [productKeys, products]);

  if (isLoadingProducts) {
    return (
      <div className={GRID_CLASS}>
        {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`mo-skel-${i}`} />)}
      </div>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {keys.map((key) => <ProductCard key={`mo-${key}`} productKey={key} className="h-full" />)}
    </div>
  );
};

export default MoLineupCarousel;
