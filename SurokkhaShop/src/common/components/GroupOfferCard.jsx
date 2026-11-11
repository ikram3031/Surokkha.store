import React, { useState } from 'react';
import { useStore, groupOfferDiscount } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { SITE_CONFIG } from '../config/siteConfig';

const API_ORIGIN = (SITE_CONFIG.apiBaseUrl || 'https://api.surokkha.store').replace(/\/$/, '');
const mediaUrl = (src) => (!src ? '' : /^(https?:|data:)/.test(src) ? src : `${API_ORIGIN}/${String(src).replace(/^\//, '')}`);

// One dashboard Group Offer on the Offers page: pick pieces, see the discount, add them to the cart together
export default function GroupOfferCard({ offer }) {
  const addGroupOfferToCart = useStore((state) => state.addGroupOfferToCart);
  const { isBn, formatNumber } = useTranslation();
  const [picks, setPicks] = useState({});
  const minPer = Math.max(1, Number(offer.minPerProduct || 1));
  const num = (n) => (isBn ? formatNumber(n) : n);

  // First tap jumps straight to the per-product minimum; going under it removes the product
  const change = (id, delta) =>
    setPicks((prev) => {
      const cur = Number(prev[id] || 0);
      let next = cur + delta;
      if (delta > 0 && cur === 0) next = minPer;
      if (delta < 0 && next < minPer) next = 0;
      return { ...prev, [id]: next };
    });

  const subtotal = (offer.products || []).reduce((s, p) => s + Number(p.unitPrice || 0) * Number(picks[p.id] || 0), 0);
  const { discount, eligible, next } = groupOfferDiscount(offer, subtotal);
  const minAmount = Number(offer.minOrderAmount || 0);
  const label = (d) => (d.discountType === 'percentage' ? `${num(d.discountValue)}%` : `৳${num(d.discountValue)}`);
  const tiers = offer.pricingMode === 'fixed' ? (offer.fixedDiscount ? [{ ...offer.fixedDiscount, minOrderAmount: minAmount }] : []) : offer.conditions || [];

  return (
    <div className="rounded-3xl border border-rose-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-start gap-4">
        {offer.imageUrl && <img src={mediaUrl(offer.imageUrl)} alt="" className="h-16 w-16 rounded-2xl object-cover shrink-0" />}
        <div className="min-w-0">
          <h3 className="text-lg font-heading font-bold text-slate-900">{offer.name}</h3>
          {offer.description && <p className="text-xs text-slate-600 mt-0.5">{offer.description}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tiers.map((d, i) => (
              <span key={i} className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                {d.minOrderAmount > 0
                  ? isBn ? `৳${num(d.minOrderAmount)}+ এ ${label(d)} ছাড়` : `${label(d)} off on ৳${d.minOrderAmount}+`
                  : isBn ? `${label(d)} ছাড়` : `${label(d)} off`}
              </span>
            ))}
            {minPer > 1 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {isBn ? `প্রতি পণ্য কমপক্ষে ${num(minPer)}টি` : `Min ${minPer} per product`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 border-y border-slate-100">
        {(offer.products || []).map((p) => {
          const qty = Number(picks[p.id] || 0);
          return (
            <div key={p.id} className="flex items-center gap-3 py-2.5">
              {p.image ? (
                <img src={mediaUrl(p.image)} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0 bg-slate-50" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-rose-50 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-slate-600">৳{num(p.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => change(p.id, -1)} disabled={qty === 0} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-700 disabled:opacity-40 cursor-pointer">−</button>
                <span className="w-6 text-center text-sm font-bold">{num(qty)}</span>
                <button type="button" onClick={() => change(p.id, 1)} className="h-8 w-8 rounded-lg border border-slate-200 font-bold text-slate-700 cursor-pointer">+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs space-y-0.5">
          <p className="text-slate-700">
            {isBn ? 'মোট:' : 'Total:'} <strong className="text-slate-900">৳{num(subtotal - discount)}</strong>
            {discount > 0 && <s className="ml-1.5 text-slate-400">৳{num(subtotal)}</s>}
          </p>
          {subtotal > 0 && !eligible && (
            <p className="text-rose-600 font-semibold">{isBn ? `আরও ৳${num(minAmount - subtotal)} এর পণ্য নিন` : `Add ৳${minAmount - subtotal} more`}</p>
          )}
          {eligible && next && (
            <p className="text-emerald-700 font-semibold">
              {isBn ? `আরও ৳${num(next.minOrderAmount - subtotal)} নিলে ${label(next)} ছাড়` : `Add ৳${next.minOrderAmount - subtotal} more for ${label(next)} off`}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={subtotal === 0 || !eligible}
          onClick={() => { addGroupOfferToCart(offer, picks); setPicks({}); }}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-5 py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          {isBn ? 'কার্টে যোগ করুন' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
