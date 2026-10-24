import React from 'react';
import { useStore, TRIAL_PACK_SLUG, TRIAL_PACK_MIN_QTY } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

// Home hero banner promoting the MO Trial Pack (mirrors the Trial Pack social creative).
// Mobile stacks like the poster (copy → packets → CTA); desktop puts the packets on the right.
export default function TrialPackHero() {
  const openProduct = useStore((state) => state.openProduct);
  const { isBn, formatNumber } = useTranslation();

  const variantChips = [
    { label: isBn ? 'আল্ট্রা থিন' : 'Ultra Thin', dot: 'bg-sky-500' },
    { label: isBn ? 'ডটেড' : 'Dotted', dot: 'bg-pink-500' },
    { label: isBn ? 'রিবড' : 'Ribbed', dot: 'bg-slate-300 ring-1 ring-slate-400/60' },
  ];

  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3] border-b border-rose-100 select-none">
      {/* Soft ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-14 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-5 md:gap-y-8 md:gap-x-10 lg:gap-x-12">

        {/* Copy */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          <span className="inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-white/80 border border-rose-200 shadow-xs text-[11px] md:text-xs lg:text-sm font-bold tracking-[0.2em] text-[#b0213f] uppercase font-['Plus_Jakarta_Sans']">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            Trial Combo Pack
          </span>

          <h1 className="mt-4 md:mt-5 font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="text-[#4a0f1f]">MO </span>
            <span className="text-[#b0213f]">Trial </span>
            <span className="text-[#e05578]">Pack</span>
          </h1>

          <p className="mt-4 md:mt-6 font-['Plus_Jakarta_Sans'] font-bold text-[11px] sm:text-sm lg:text-base tracking-[0.25em] md:tracking-[0.3em] text-[#3d0c18] uppercase flex items-center justify-center md:justify-start gap-2 md:gap-3">
            <span>Try</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            <span>Compare</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            <span>Choose Yours</span>
          </p>

          <p className="mt-2 md:mt-3 text-base sm:text-lg lg:text-xl font-semibold text-[#5a2a35] font-bengali">
            একসাথে ট্রাই করুন, নিজের জন্য সঠিকটা বেছে নিন
          </p>

          {/* Variants included */}
          <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-2.5">
            {variantChips.map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-2 px-3 md:px-3.5 py-1 md:py-1.5 rounded-full bg-white/80 border border-rose-100 text-xs lg:text-sm font-semibold text-slate-700 shadow-2xs">
                <span className={`w-2.5 h-2.5 rounded-full ${chip.dot}`} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        {/* Packets visual */}
        <div className="flex justify-center items-center md:col-start-2 md:row-start-1 md:row-span-2">
          <img
            src="/banners/trial-pack-packets.webp"
            alt="MO Trial Pack — Ultra Thin, Dotted and Ribbed"
            onClick={() => openProduct(TRIAL_PACK_SLUG)}
            className="w-full max-w-[420px] md:max-w-[600px] h-auto cursor-pointer"
            loading="eager"
            draggable="false"
          />
        </div>

        {/* CTA */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-2 md:self-start">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
            <button
              type="button"
              onClick={() => openProduct(TRIAL_PACK_SLUG)}
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
                ? `মিনিমাম ${formatNumber(TRIAL_PACK_MIN_QTY)} পিস — যেকোনো ভেরিয়েন্ট মিলিয়ে`
                : `Min. ${TRIAL_PACK_MIN_QTY} pieces — mix any variants`}
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
