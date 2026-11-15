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

const findSmartPack = (products) =>
  Object.values(products).find((p) => p && p.isActive !== false && `${p.slug || ''} ${p.name || ''}`.toLowerCase().includes('smart')) || null;

const toBn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const pad = (n) => String(n).padStart(2, '0');

export default function TodayOfferHero() {
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  // This banner is always in Bangla
  const isBn = true;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const product = findSmartPack(products);
  const slug = product?.slug || product?.id || '';
  const imagePath = product?.imageUrl || '';
  const imageUrl = imagePath ? (imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}${imagePath}`) : '';
  const regular = product ? Math.max(product.price || 0, product.offerPrice || 0) : 0;

  const left = Math.max(0, Math.floor((TODAY_OFFER.end - now) / 1000));
  const parts = [
    { v: Math.floor(left / 3600), bn: 'ঘণ্টা', en: 'Hours' },
    { v: Math.floor((left % 3600) / 60), bn: 'মিনিট', en: 'Min' },
    { v: left % 60, bn: 'সেকেন্ড', en: 'Sec' },
  ];
  const num = (n) => (isBn ? toBn(pad(n)) : pad(n));
  const open = () => slug && openProduct(slug);

  return (
    <section className="w-full md:max-h-[70vh] flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3] border-b border-rose-100 select-none">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 md:py-4 lg:py-5 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-4 md:gap-y-4 md:gap-x-10 lg:gap-x-12">
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          <span className="inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-[#b0213f] text-white shadow-md text-xs lg:text-sm font-bold font-bengali animate-pulse">
            ⏰ {isBn ? 'শুধুমাত্র আজকের জন্য' : 'Today Only'}
          </span>

          <h1 className="mt-3 md:mt-5 font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] text-[clamp(1.6rem,8vw,2.2rem)] sm:text-5xl lg:text-6xl">
            <span className="text-[#4a0f1f]">MO </span>
            <span className="text-[#b0213f]">Smart Pack</span>
          </h1>

          <p className="mt-3 md:mt-4 text-base sm:text-lg lg:text-xl font-semibold text-[#5a2a35] font-bengali">
            {isBn ? 'শুধু আজকের জন্য মাত্র ' : 'Today only for just '}
            <span className="text-[#b0213f] font-extrabold text-2xl lg:text-3xl">৳{isBn ? toBn(TODAY_OFFER.price) : TODAY_OFFER.price}</span>
            {regular > TODAY_OFFER.price && (
              <span className="ml-2 text-slate-400 line-through">৳{isBn ? toBn(regular) : regular}</span>
            )}
          </p>

          {/* Countdown to 11:59 PM tonight */}
          <div className="mt-4 md:mt-5 flex items-center justify-center md:justify-start gap-2 md:gap-3" aria-live="off">
            {parts.map((p, i) => (
              <React.Fragment key={p.en}>
                {i > 0 && <span className="text-2xl font-extrabold text-[#b0213f]">:</span>}
                <div className="flex flex-col items-center min-w-[3.5rem] md:min-w-[4.25rem] px-2 py-1.5 md:py-2 rounded-xl bg-[#4a0f1f] text-white shadow-lg">
                  <span className="text-2xl md:text-3xl font-extrabold font-['Plus_Jakarta_Sans'] tabular-nums">{num(p.v)}</span>
                  <span className="text-[10px] md:text-xs text-rose-200 font-bengali">{isBn ? p.bn : p.en}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
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
            className="inline-flex items-center gap-3 pl-2 pr-8 py-2 rounded-full bg-gradient-to-r from-[#5a1426] to-[#a51d3a] hover:from-[#6b1830] hover:to-[#be2446] text-white shadow-xl shadow-rose-900/20 transition cursor-pointer active:scale-95"
          >
            <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/15 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2.5 3.5h2.7l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1" />
              </svg>
            </span>
            <span className="text-lg lg:text-xl font-extrabold font-bengali">এখনই অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </section>
  );
}
