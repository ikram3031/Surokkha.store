import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const SMART_PACK_SLUG = 'mo-smart-pack-18-pcs';
const PROTECTION_COMBO_SLUG = 'protection-combo-20-pcs-50gm-gel';
const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

// Offer price, regular price, savings and discount % of a product, from its catalog prices
const priceInfo = (p) => {
  const regular = Number(p?.regularPrice || p?.price || 0);
  const offerRaw = Number(p?.offerPrice);
  const price = offerRaw > 0 && offerRaw < regular ? offerRaw : regular;
  const save = regular > price ? regular - price : 0;
  return { price, regular, save, pct: save && regular ? Math.round((save / regular) * 100) : 0 };
};

// Two offer cards for the menus (desktop Shop dropdown + mobile drawer):
// MO Smart Pack with its discount as the main focus, and the Protection Combo.
export default function NavOfferCards({ onNavigate, compact = false }) {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  const { isBn } = useTranslation();

  const smart = products[SMART_PACK_SLUG];
  const protection = products[PROTECTION_COMBO_SLUG];
  const r = priceInfo(smart);
  const pc = priceInfo(protection);

  const open = (slug) => {
    if (onNavigate) onNavigate();
    openProduct(slug);
  };
  const num = (n) => (isBn ? bn(n) : n);

  return (
    <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-4'}`}>
      {/* MO Smart Pack: discount first */}
      <button
        type="button"
        onClick={() => open(SMART_PACK_SLUG)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-rose-600 to-[#4a0d24] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        {r.pct > 0 && (
          <span className={`rounded-full bg-amber-400 font-extrabold text-black ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
            🔥 {isBn ? `${num(r.pct)}% ছাড়` : `${r.pct}% OFF`}
          </span>
        )}
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {isBn ? 'এমও স্মার্ট প্যাক' : 'MO Smart Pack'}
        </span>
        {r.price > 0 && (
          <span className={`mt-1 flex items-baseline gap-1.5 ${compact ? '' : 'mt-2'}`}>
            <span className={`font-black ${compact ? 'text-lg' : 'text-3xl'}`}>৳{num(r.price)}</span>
            {r.save > 0 && <span className={`line-through text-white/70 ${compact ? 'text-xs' : 'text-base'}`}>৳{num(r.regular)}</span>}
          </span>
        )}
        {r.save > 0 && (
          <span className={`mt-1 font-bold text-amber-300 ${compact ? 'text-[11px]' : 'text-sm'}`}>
            {isBn ? `৳${num(r.save)} সাশ্রয়` : `Save ৳${r.save}`}
          </span>
        )}
      </button>

      {/* Protection Combo: 20 pcs + 50 g gel */}
      <button
        type="button"
        onClick={() => open(PROTECTION_COMBO_SLUG)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-emerald-600 to-[#064e3b] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        {protection?.freeDelivery ? (
          <span className={`rounded-full bg-white font-extrabold text-emerald-800 ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
            🚚 {isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery'}
          </span>
        ) : pc.pct > 0 && (
          <span className={`rounded-full bg-white font-extrabold text-emerald-800 ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
            🔥 {isBn ? `${num(pc.pct)}% ছাড়` : `${pc.pct}% OFF`}
          </span>
        )}
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {isBn ? 'প্রটেকশন কম্বো' : 'Protection Combo'}
        </span>
        {pc.price > 0 && (
          <span className={`mt-1 flex items-baseline gap-1.5 ${compact ? '' : 'mt-2'}`}>
            <span className={`font-black ${compact ? 'text-lg' : 'text-3xl'}`}>৳{num(pc.price)}</span>
            {pc.save > 0 && <span className={`line-through text-white/70 ${compact ? 'text-xs' : 'text-base'}`}>৳{num(pc.regular)}</span>}
          </span>
        )}
        <span className={`mt-1 font-bold text-emerald-100 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {isBn ? '২০ পিস + ৫০ গ্রাম জেল' : '20 pcs + 50 g gel'}
        </span>
      </button>
    </div>
  );
}
