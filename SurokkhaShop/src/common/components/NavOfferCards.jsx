import React from 'react';
import { useStore, TRIAL_PACK_SLUG } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const MEGA_COMBO_SLUG = 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

// Two offer cards for the menus (desktop Shop dropdown + mobile drawer):
// 30 pcs Mega Combo with its discount as the main focus, and the Trial Pack with free delivery.
export default function NavOfferCards({ onNavigate, compact = false }) {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  const { isBn } = useTranslation();

  const mega = products[MEGA_COMBO_SLUG];
  const megaPrice = Number(mega?.offerPrice || 950);
  const megaOld = Math.max(1350, Number(mega?.price || 0), Number(mega?.regularPrice || 0));
  const megaSave = megaOld > megaPrice ? megaOld - megaPrice : 0;
  const megaPct = megaSave ? Math.round((megaSave / megaOld) * 100) : 0;

  const trial = products[TRIAL_PACK_SLUG];
  const trialPrice = trial ? Number(trial.offerPrice || trial.price || 0) : 0;

  const open = (slug) => {
    if (onNavigate) onNavigate();
    openProduct(slug);
  };
  const num = (n) => (isBn ? bn(n) : n);

  return (
    <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-4'}`}>
      {/* Mega Combo: discount first */}
      <button
        type="button"
        onClick={() => open(MEGA_COMBO_SLUG)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-rose-600 to-[#4a0d24] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        <span className={`rounded-full bg-amber-400 font-extrabold text-black ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          🔥 {isBn ? `${num(megaPct)}% ছাড়` : `${megaPct}% OFF`}
        </span>
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {isBn ? '৩০ পিস মেগা কম্বো' : '30 pcs Mega Combo'}
        </span>
        <span className={`mt-1 flex items-baseline gap-1.5 ${compact ? '' : 'mt-2'}`}>
          <span className={`font-black ${compact ? 'text-lg' : 'text-3xl'}`}>৳{num(megaPrice)}</span>
          <span className={`line-through text-white/70 ${compact ? 'text-xs' : 'text-base'}`}>৳{num(megaOld)}</span>
        </span>
        {megaSave > 0 && (
          <span className={`mt-1 font-bold text-amber-300 ${compact ? 'text-[11px]' : 'text-sm'}`}>
            {isBn ? `৳${num(megaSave)} সাশ্রয়` : `Save ৳${megaSave}`}
          </span>
        )}
      </button>

      {/* Trial Pack: free delivery first */}
      <button
        type="button"
        onClick={() => open(TRIAL_PACK_SLUG)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-emerald-600 to-[#064e3b] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        <span className={`rounded-full bg-white font-extrabold text-emerald-800 ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          🚚 {isBn ? 'ফ্রি ডেলিভারি' : 'Free Delivery'}
        </span>
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {isBn ? 'সুরক্ষা ট্রায়াল প্যাক' : 'Surokkha Trial Pack'}
        </span>
        {trialPrice > 0 && (
          <span className={`mt-1 font-black ${compact ? 'text-lg' : 'text-3xl mt-2'}`}>৳{num(trialPrice)}</span>
        )}
        <span className={`mt-1 font-bold text-emerald-100 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {isBn ? '৬ ভ্যারিয়েন্ট, ১২ পিস' : '6 variants, 12 pcs'}
        </span>
      </button>
    </div>
  );
}
