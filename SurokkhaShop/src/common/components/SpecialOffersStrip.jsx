import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from './ProductCard';

// Discount as a percentage of the regular price, worked out the same way as the badge on ProductCard
const discountPercent = (p) => {
  const regular = Number(p?.regularPrice || p?.price || 0);
  const offer = Number(p?.offerPrice);
  if (!(regular > 0) || !(offer > 0) || offer >= regular) return 0;
  return ((regular - offer) / regular) * 100;
};

// Extra non-product items (KY Jelly, Surokkha Trial Pack) that always join the strip
const EXTRA_KEYS = ['ky-jelly-personal-lubricant-gel-50g', 'surokkha-trial-pack'];
const MAX_PRODUCTS = 8;

const isOnSale = (p) => p && p.isActive !== false && !p.groupOffer && discountPercent(p) > 0;

// "Best Offers Right Now" strip on the home page: across every product (not items), the biggest
// discounts by percentage, plus the extra items above, all ordered by discount, biggest first.
export default function SpecialOffersStrip() {
  const products = useStore((s) => s.products);
  const productKeys = useStore((s) => s.productKeys);
  const { isBn } = useTranslation();

  const keys = useMemo(() => {
    const all = productKeys || [];
    // Stable sort: equal discounts keep the catalog order
    const byDiscount = (list) => [...list].sort((a, b) => discountPercent(products[b]) - discountPercent(products[a]));
    const topProducts = byDiscount(
      all.filter((key) => products[key]?.itemType !== 'item' && isOnSale(products[key]))
    ).slice(0, MAX_PRODUCTS);
    const extras = EXTRA_KEYS.filter((key) => all.includes(key) && isOnSale(products[key]) && !topProducts.includes(key));
    return byDiscount([...topProducts, ...extras]);
  }, [products, productKeys]);

  if (keys.length === 0) return null;

  return (
    <section id="specialOffers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
        <span className="text-xs font-bold tracking-widest text-brand-800 uppercase bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200/70 inline-flex items-center gap-1.5">
          <span>🔥</span>
          <span>{isBn ? 'স্পেশাল ডিসকাউন্ট' : 'Special Discount'}</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mt-3">
          {isBn ? 'এই মুহূর্তের সেরা অফার' : 'Best Offers Right Now'}
        </h2>
        <p className="text-xs sm:text-sm text-black mt-1.5">
          {isBn ? 'সবচেয়ে কম দামে সীমিত সময়ের অফার।' : 'Our lowest prices, for a limited time.'}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {keys.map((key) => <ProductCard key={`offer-${key}`} productKey={key} className="h-full" />)}
      </div>
    </section>
  );
}
