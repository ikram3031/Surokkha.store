import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { SITE_CONFIG } from '../config/siteConfig';
import ProductCard from './ProductCard';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl.replace(/\/$/, '');

// "Best Offers Right Now" strip on the home page.
// Shows the products picked in the dashboard (Settings → Product Showcase → Featured), in that order.
// When nothing is picked it falls back to every product with an offer price.
export default function SpecialOffersStrip() {
  const products = useStore((s) => s.products);
  const productKeys = useStore((s) => s.productKeys);
  const { isBn } = useTranslation();
  const [featuredIds, setFeaturedIds] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/v1/store-utils`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('store-utils failed'))))
      .then((json) => {
        const list = (json?.data || json)?.featured;
        setFeaturedIds(Array.isArray(list) ? list.map((f) => String(typeof f === 'object' ? (f._id || f.id || f.did || f.slug) : f)) : []);
      })
      .catch((err) => { if (err.name !== 'AbortError') setFeaturedIds([]); });
    return () => controller.abort();
  }, []);

  const keys = useMemo(() => {
    const all = productKeys || [];
    if (featuredIds && featuredIds.length) {
      const idOf = (key) => {
        const p = products[key] || {};
        return [key, p.slug, p._id, p.mongoId, p.did].filter(Boolean).map(String);
      };
      return featuredIds
        .map((id) => all.find((key) => idOf(key).includes(id)))
        .filter(Boolean);
    }
    return all.filter((key) => {
      const p = products[key];
      if (!p) return false;
      const offer = Number(p.offerPrice);
      const regular = Number(p.regularPrice);
      return offer > 0 && regular > 0 && offer < regular;
    });
  }, [products, productKeys, featuredIds]);

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
