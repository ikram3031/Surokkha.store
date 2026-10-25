import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// 30-piece combo: 1x Ultra Thin + 1x Dotted + 1x Ribbed retail box (10 pcs each)
const ULTIMATE_COMBO_SLUG = 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
const FALLBACK_IMAGE = '/uploads/2610/261025/mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo_main_1792933776798.webp';

// Home hero banner promoting the Ultimate 3-in-1 combo. Same layout as TrialPackHero
// (mobile: copy → image → CTA; desktop: image on the right) in a dark berry/gold theme.
// The image follows the product's featured image from the dashboard.
export default function UltimateComboHero() {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  const { isBn } = useTranslation();

  const imagePath = products[ULTIMATE_COMBO_SLUG]?.imageUrl || FALLBACK_IMAGE;
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;

  const boxChips = [
    { label: isBn ? '১০ পিস আল্ট্রা থিন' : '10x Ultra Thin', dot: 'bg-sky-400' },
    { label: isBn ? '১০ পিস ডটেড' : '10x Dotted', dot: 'bg-pink-400' },
    { label: isBn ? '১০ পিস রিবড' : '10x Ribbed', dot: 'bg-slate-200' },
  ];

  return (
    <section className="w-full flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#2a0a14] via-[#1a0710] to-[#3b0d1d] text-white select-none">
      {/* Soft ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-rose-600/20 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:py-10 lg:py-14 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-5 md:gap-y-8 md:gap-x-10 lg:gap-x-12">

        {/* Copy */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          <span className="inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-amber-400/10 border border-amber-400/50 text-[11px] md:text-xs lg:text-sm font-bold tracking-[0.2em] text-amber-300 uppercase font-['Plus_Jakarta_Sans']">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Best Value Combo
          </span>

          <h1 className="mt-4 md:mt-5 font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="text-white">Ultimate </span>
            <span className="text-amber-400 whitespace-nowrap">3-in-1</span>
          </h1>

          <p className="mt-4 md:mt-6 font-['Plus_Jakarta_Sans'] font-bold text-[11px] sm:text-sm lg:text-base tracking-[0.25em] md:tracking-[0.3em] text-rose-100 uppercase flex items-center justify-center md:justify-start gap-2 md:gap-3">
            <span>Ultra Thin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Dotted</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Ribbed</span>
          </p>

          <p className="mt-2 md:mt-3 text-base sm:text-lg lg:text-xl font-semibold text-rose-100/90 font-bengali">
            তিন ধরনের ৩টি পূর্ণ বক্স — সব একসাথে এক প্যাকেজে
          </p>

          {/* Boxes included */}
          <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-2.5">
            {boxChips.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-2 px-3 md:px-3.5 py-1 md:py-1.5 rounded-full bg-white/10 border border-white/15 text-xs lg:text-sm font-semibold text-white">
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
            alt="MO Ultimate 3-in-1 Combo — Ultra Thin, Dotted and Ribbed"
            onClick={() => openProduct(ULTIMATE_COMBO_SLUG)}
            className="w-full max-w-[340px] md:max-w-[480px] aspect-square object-cover rounded-3xl ring-4 ring-amber-400/30 shadow-2xl shadow-black/50 cursor-pointer"
            loading="eager"
            draggable="false"
          />
        </div>

        {/* CTA */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-2 md:self-start">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
            <button
              type="button"
              onClick={() => openProduct(ULTIMATE_COMBO_SLUG)}
              className="inline-flex items-center gap-3 pl-2 pr-8 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#2a0a14] shadow-xl shadow-amber-900/30 transition cursor-pointer active:scale-95"
            >
              <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="18" cy="20" r="1.4" />
                  <path d="M2.5 3.5h2.7l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1" />
                </svg>
              </span>
              <span className="text-lg lg:text-xl font-extrabold font-['Plus_Jakarta_Sans']">Order Now</span>
            </button>

            <div className="text-sm font-semibold text-rose-100 leading-snug">
              {isBn
                ? 'মোট ৩০ পিস — ৩ ধরনের, প্রতিটা ১০ পিস করে'
                : '30 pieces in total — 3 types, 10 of each'}
            </div>
          </div>

          <p className="mt-4 md:mt-6 text-xs text-rose-200/60">
            {isBn ? 'শুধুমাত্র প্রাপ্তবয়স্কদের জন্য (১৮+)' : 'For adults only (18+)'}
          </p>
        </div>
      </div>
    </section>
  );
}
