import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// 20 condoms + 50gm lubricant gel combo
const PROTECTION_COMBO_SLUG = 'protection-combo-20-pcs-50gm-gel';
const FALLBACK_IMAGE = '/uploads/2610/261018/product_protection_combo_20pcs_50g.webp';

// Home hero banner promoting the Protection Combo (20 pcs + 50gm gel). Same layout and theme as TrialPackHero
// (mobile: copy → image → CTA; desktop: image on the right).
// The image follows the product's featured image from the dashboard.
export default function ProtectionComboHero() {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  const { isBn } = useTranslation();

  const imagePath = products[PROTECTION_COMBO_SLUG]?.imageUrl || FALLBACK_IMAGE;
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;

  const boxChips = [
    { label: isBn ? '২০ পিস কনডম' : '20 pcs Condoms', dot: 'bg-sky-400' },
    { label: isBn ? '৫০ গ্রাম জেল' : '50gm Gel', dot: 'bg-pink-400' },
  ];

  return (
    <section className="w-full flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3] border-b border-rose-100 select-none">
      {/* Soft ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:py-10 lg:py-14 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-5 md:gap-y-8 md:gap-x-10 lg:gap-x-12">

        {/* Copy */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          <span className="inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-white/80 border border-rose-200 shadow-xs text-[11px] md:text-xs lg:text-sm font-bold tracking-[0.2em] text-[#b0213f] uppercase font-['Plus_Jakarta_Sans']">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            Protection Combo
          </span>

          <h1 className="mt-4 md:mt-5 font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="text-[#4a0f1f]">Protection </span>
            <span className="text-[#b0213f]">Combo</span>
          </h1>

          <p className="mt-4 md:mt-6 font-['Plus_Jakarta_Sans'] font-bold text-[11px] sm:text-sm lg:text-base tracking-[0.25em] md:tracking-[0.3em] text-[#3d0c18] uppercase flex items-center justify-center md:justify-start gap-2 md:gap-3">
            <span>20 Pcs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            <span>50gm Gel</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            <span>One Pack</span>
          </p>

          <p className="mt-2 md:mt-3 text-base sm:text-lg lg:text-xl font-semibold text-[#5a2a35] font-bengali">
            ২০ পিস কনডম আর ৫০ গ্রাম জেল — সব একসাথে এক প্যাকেজে
          </p>

          {/* Boxes included */}
          <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-2.5">
            {boxChips.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-2 px-3 md:px-3.5 py-1 md:py-1.5 rounded-full bg-white/80 border border-rose-100 text-xs lg:text-sm font-semibold text-slate-700 shadow-2xs">
                <span className={`w-2.5 h-2.5 rounded-full ${chip.dot}`} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Product visual */}
        <div className="flex justify-center items-center md:col-start-2 md:row-start-1 md:row-span-2">
          <img
            src={imageUrl}
            alt="Protection Combo — 20 pcs condoms and 50gm gel"
            onClick={() => openProduct(PROTECTION_COMBO_SLUG)}
            className="w-full max-w-[340px] md:max-w-[480px] aspect-square object-cover rounded-3xl ring-4 ring-rose-200/70 shadow-2xl shadow-rose-900/20 cursor-pointer"
            loading="eager"
            draggable="false"
          />
        </div>

        {/* CTA */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-2 md:self-start">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
            <button
              type="button"
              onClick={() => openProduct(PROTECTION_COMBO_SLUG)}
              className="inline-flex items-center gap-3 pl-2 pr-8 py-2 rounded-full bg-gradient-to-r from-[#5a1426] to-[#a51d3a] hover:from-[#6b1830] hover:to-[#be2446] text-white shadow-xl shadow-rose-900/20 transition cursor-pointer active:scale-95"
            >
              <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="18" cy="20" r="1.4" />
                  <path d="M2.5 3.5h2.7l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1" />
                </svg>
              </span>
              <span className="text-lg lg:text-xl font-extrabold font-['Plus_Jakarta_Sans']">Order Now</span>
            </button>

            <div className="text-sm font-semibold text-[#5a2a35] leading-snug">
              {isBn
                ? '২০ পিস কনডম + ৫০ গ্রাম জেল, একসাথে এক প্যাকেজে'
                : '20 condoms + 50gm gel in one pack'}
            </div>
          </div>

          <p className="mt-4 md:mt-6 text-xs text-slate-500">
            {isBn ? 'শুধুমাত্র প্রাপ্তবয়স্কদের জন্য (১৮+)' : 'For adults only (18+)'}
          </p>
        </div>
      </div>
    </section>
  );
}
