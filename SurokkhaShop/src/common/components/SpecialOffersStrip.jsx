import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import ProductCard from './ProductCard';
import { HARDCODED_OFFERS } from '../config/hardcodedOffers';

// "Special Offers" strip on the home page: the hard-coded lowest-price offers, in the order set in
// config/hardcodedOffers.js. Prices themselves are applied in the store (useStore), so cards, cart and checkout agree.
export default function SpecialOffersStrip() {
  const products = useStore((s) => s.products);
  const productKeys = useStore((s) => s.productKeys);
  const { isBn } = useTranslation();

  const keys = useMemo(() => {
    const byMongoId = {};
    for (const key of productKeys || []) {
      const p = products[key];
      if (p) byMongoId[String(p._id || p.mongoId || '')] = key;
    }
    return HARDCODED_OFFERS.map((o) => byMongoId[o.id]).filter(Boolean);
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
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
          {isBn ? 'সবচেয়ে কম দামে সীমিত সময়ের অফার।' : 'Our lowest prices, for a limited time.'}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {keys.map((key) => <ProductCard key={`offer-${key}`} productKey={key} className="h-full" />)}
      </div>
    </section>
  );
}
