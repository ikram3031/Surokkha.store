import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// One-day offer: MO Smart Pack for ৳450, today only (Bangladesh time, 12:00 AM – 11:59:59 PM).
export const TODAY_OFFER = {
  start: new Date('2026-11-16T00:00:00+06:00').getTime(),
  end: new Date('2026-11-16T23:59:59+06:00').getTime(),
  price: 450,
};

export const isTodayOfferLive = (now = Date.now()) => now >= TODAY_OFFER.start && now <= TODAY_OFFER.end;

export const findSmartPack = (products) =>
  Object.values(products).find((p) => p && p.isActive !== false && `${p.slug || ''} ${p.name || ''}`.toLowerCase().includes('smart')) || null;

export const toBn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const pad = (n) => String(n).padStart(2, '0');

// Seconds left until the offer ends, ticking every second
export function useTodayOfferSecondsLeft() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((TODAY_OFFER.end - now) / 1000));
}

// Hours : minutes : seconds countdown to the end of the offer (hero and cart drawer share it)
export function TodayOfferCountdown({ small = false, className = '' }) {
  const left = useTodayOfferSecondsLeft();
  const parts = [
    { v: Math.floor(left / 3600), bn: 'ঘণ্টা' },
    { v: Math.floor((left % 3600) / 60), bn: 'মিনিট' },
    { v: left % 60, bn: 'সেকেন্ড' },
  ];
  return (
    <div className={`flex items-center gap-2 ${small ? '' : 'md:gap-3'} ${className}`} aria-live="off">
      {parts.map((p, i) => (
        <React.Fragment key={p.bn}>
          {i > 0 && <span className={`${small ? 'text-base' : 'text-2xl'} font-extrabold text-[#b0213f]`}>:</span>}
          <div className={`flex flex-col items-center rounded-xl bg-[#4a0f1f] text-white shadow-lg ${small ? 'min-w-[2.6rem] px-1.5 py-1' : 'min-w-[3.5rem] md:min-w-[4.25rem] px-2 py-1.5 md:py-2'}`}>
            <span className={`${small ? 'text-base' : 'text-2xl md:text-3xl'} font-extrabold font-['Plus_Jakarta_Sans'] tabular-nums`}>{toBn(pad(p.v))}</span>
            <span className={`${small ? 'text-[9px]' : 'text-[10px] md:text-xs'} text-rose-200 font-bengali`}>{p.bn}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// Today-offer saving on the Smart Pack: taka and percent off its regular price
export const todayOfferSaving = (product) => {
  const regular = Number(product?.regularPrice || product?.price || 0);
  const save = regular > TODAY_OFFER.price ? regular - TODAY_OFFER.price : 0;
  return { regular, save, pct: save ? Math.round((save / regular) * 100) : 0 };
};

export default function TodayOfferHero() {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);

  const product = findSmartPack(products);
  const slug = product?.slug || product?.id || '';
  const imagePath = product?.imageUrl || '';
  const imageUrl = imagePath ? (imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`) : '';

  const open = () => slug && openProduct(slug);

  return (
    <section className="w-full md:max-h-[70vh] flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3] border-b border-rose-100 select-none">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 md:py-4 lg:py-5 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-4 md:gap-y-4 md:gap-x-10 lg:gap-x-12">
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          <h1 className="font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] text-[clamp(1.6rem,8vw,2.2rem)] sm:text-5xl lg:text-6xl">
            <span className="text-[#4a0f1f]">MO </span>
            <span className="text-[#b0213f]">Smart Pack</span>
          </h1>

          {/* Countdown to 11:59 PM tonight */}
          <TodayOfferCountdown className="mt-4 md:mt-5 justify-center md:justify-start" />
        </div>

        {imageUrl && (
          <div className="order-first md:order-none flex justify-center items-center md:col-start-2 md:row-start-1 md:row-span-2">
            <img
              src={imageUrl}
              alt="MO Smart Pack"
              onClick={open}
              className="w-full max-w-[300px] md:max-w-[min(380px,52vh)] aspect-square object-cover rounded-3xl ring-4 ring-rose-200/70 shadow-2xl shadow-rose-900/20 cursor-pointer"
              loading="eager"
              draggable="false"
            />
          </div>
        )}

        <div className="text-center md:text-left md:col-start-1 md:row-start-2 md:self-start">
          <button
            type="button"
            onClick={open}
            className="hero-cta-nudge inline-flex items-center gap-2 md:gap-3 pl-5 pr-1.5 py-1.5 md:pl-8 md:pr-2 md:py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-white shadow-xl shadow-rose-600/40 cursor-pointer"
          >
            <span className="text-sm md:text-lg lg:text-xl font-extrabold font-bengali">প্রোডাক্টটি দেখুন</span>
            <span className="hero-cta-arrow w-7 h-7 md:w-11 md:h-11 rounded-full bg-white text-rose-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
