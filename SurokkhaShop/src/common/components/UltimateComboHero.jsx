import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// 30-piece combo: 1x Ultra Thin + 1x Textured + 1x Contour retail box (10 pcs each)
const ULTIMATE_COMBO_SLUG = 'mo-combo-pack';
const FALLBACK_IMAGE = '/uploads/2611/261116/mo-smart-pack-15-pcs_main_1794796181110.webp';

// Home hero banner promoting the Ultimate 3-in-1 combo. Same layout as TrialPackHero
// (mobile: copy → image → CTA; desktop: image on the right) in a dark berry/gold theme.
// The image follows the product's featured image from the dashboard.
export default function UltimateComboHero() {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  const { isBn } = useTranslation();

  const prod = products[ULTIMATE_COMBO_SLUG] || products['mo-smart-pack-18-pcs'] || Object.values(products).find((p) => p && (p.slug?.includes('combo') || p.name?.toLowerCase().includes('combo'))) || null;
  const comboSlug = prod?.slug || ULTIMATE_COMBO_SLUG;

  // Old price shown is the full 3-box price (৳1350); offer price comes live from the product
  const oldPrice = Math.max(1350, Number(prod?.price || 0), Number(prod?.regularPrice || 0));
  const offerPrice = Number(prod?.offerPrice || 950);
  const savings = oldPrice > offerPrice ? oldPrice - offerPrice : 0;
  const pct = savings ? Math.round((savings / oldPrice) * 100) : 0;
  const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

  const imagePath = prod?.imageUrl || products[ULTIMATE_COMBO_SLUG]?.imageUrl || FALLBACK_IMAGE;
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`;

  return (
    <section className="w-full md:max-h-[70vh] min-w-0 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3] border-b border-rose-100 select-none">
      {/* Soft ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 md:py-4 lg:py-5 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-5 md:gap-y-4 md:gap-x-10 lg:gap-x-12">

        {/* Copy */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          <h1 className="mt-0 md:mt-5 font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] whitespace-nowrap md:whitespace-normal text-[clamp(1.25rem,7.2vw,1.9rem)] sm:text-5xl lg:text-6xl">
            <span className="text-[#4a0f1f]">30 Pieces </span>
            <span className="text-[#b0213f]">Mega Combo</span>
          </h1>

          {/* Price focus */}
          <div className="mt-3 flex flex-wrap items-baseline justify-center md:justify-start gap-3">
            <span className="text-4xl lg:text-5xl font-black text-[#b0213f] font-['Plus_Jakarta_Sans']">৳{offerPrice}</span>
            {savings > 0 && (
              <>
                <span className="text-xl sm:text-2xl font-bold text-black/50 line-through">৳{oldPrice}</span>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-extrabold">
                  {isBn ? `৳${bn(savings)} সাশ্রয়` : `Save ৳${savings}`}
                </span>
              </>
            )}
          </div>

          <p className="mt-4 md:mt-6 font-['Plus_Jakarta_Sans'] font-bold text-[11px] sm:text-sm lg:text-base tracking-[0.25em] md:tracking-[0.3em] text-[#3d0c18] uppercase hidden">
            <span>Ultra Thin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            <span>Textured</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
            <span>Contour</span>
          </p>

          <p className="mt-2 text-base sm:text-lg font-semibold text-[#5a2a35] font-bengali">
            তিন ধরনের ৩টি পূর্ণ বক্স — সব একসাথে এক প্যাকেজে
          </p>
        </div>

        {/* Product visual */}
        <div className="order-first md:order-none flex justify-center items-center md:col-start-2 md:row-start-1 md:row-span-2">
          <img
            src={imageUrl}
            alt="MO Ultimate 3-in-1 Combo — Ultra Thin, Textured and Contour"
            onClick={() => openProduct(comboSlug)}
            className="w-full max-w-[340px] md:max-w-[min(380px,52vh)] aspect-square object-cover rounded-3xl ring-4 ring-rose-200/70 shadow-2xl shadow-rose-900/20 cursor-pointer"
            loading="eager"
            draggable="false"
          />
        </div>

        {/* CTA */}
        <div className="text-center md:text-left md:col-start-1 md:row-start-2 md:self-start">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
            <button
              type="button"
              onClick={() => openProduct(comboSlug)}
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
          </div>
        </div>
      </div>
    </section>
  );
}
