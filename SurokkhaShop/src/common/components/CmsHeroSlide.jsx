import React from 'react';
import { useStore } from '../store/useStore';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// Resolves a stored image path into a full URL
const resolveImage = (path) => {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
};

// Single CMS-driven hero slide. Same layout as UltimateComboHero, every text, chip, link and image comes from the dashboard.
export default function CmsHeroSlide({ slide }) {
  const openProduct = useStore((state) => state.openProduct);
  const navigateTo = useStore((state) => state.navigateTo);
  const navigateToCombo = useStore((state) => state.navigateToCombo);

  const link = (slide.ctaLink || '').trim();
  const imageUrl = resolveImage(slide.image);
  const tagline = slide.tagline || [];
  const chips = slide.chips || [];

  // Routes the CTA: "shop", "combo", a URL/path, or a product slug
  const handleCta = () => {
    if (!link) return;
    if (link === 'shop') return navigateTo('shop');
    if (link === 'combo') return navigateToCombo();
    if (/^https?:\/\//.test(link) || link.startsWith('/')) {
      window.location.href = link;
      return;
    }
    openProduct(link);
  };

  return (
    <section className="w-full flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3] border-b border-rose-100 select-none">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] w-[30rem] h-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:py-10 lg:py-14 grid grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_auto] gap-y-5 md:gap-y-8 md:gap-x-10 lg:gap-x-12">
        <div className="text-center md:text-left md:col-start-1 md:row-start-1 md:self-end">
          {slide.badge && (
            <span className="inline-flex items-center gap-2 px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-white/80 border border-rose-200 shadow-xs text-[11px] md:text-xs lg:text-sm font-bold tracking-[0.2em] text-[#b0213f] uppercase font-['Plus_Jakarta_Sans']">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />
              {slide.badge}
            </span>
          )}

          {(slide.titleDark || slide.titleAccent) && (
            <h1 className="mt-4 md:mt-5 font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight leading-[0.95] text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-8xl">
              {slide.titleDark && <span className="text-[#4a0f1f]">{slide.titleDark} </span>}
              {slide.titleAccent && <span className="text-[#b0213f]">{slide.titleAccent}</span>}
            </h1>
          )}

          {tagline.length > 0 && (
            <p className="mt-4 md:mt-6 font-['Plus_Jakarta_Sans'] font-bold text-[11px] sm:text-sm lg:text-base tracking-[0.25em] md:tracking-[0.3em] text-[#3d0c18] uppercase flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
              {tagline.map((word, i) => (
                <React.Fragment key={`${word}-${i}`}>
                  {i > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#e05578]" />}
                  <span>{word}</span>
                </React.Fragment>
              ))}
            </p>
          )}

          {slide.subtitle && (
            <p className="mt-2 md:mt-3 text-base sm:text-lg lg:text-xl font-semibold text-[#5a2a35] font-bengali">
              {slide.subtitle}
            </p>
          )}

          {chips.length > 0 && (
            <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-2.5">
              {chips.map((chip, i) => (
                <span key={`${chip.label}-${i}`} className="inline-flex items-center gap-2 px-3 md:px-3.5 py-1 md:py-1.5 rounded-full bg-white/80 border border-rose-100 text-xs lg:text-sm font-semibold text-slate-700 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chip.color || '#e05578' }} />
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="flex justify-center items-center md:col-start-2 md:row-start-1 md:row-span-2">
            <img
              src={imageUrl}
              alt={slide.imageAlt || slide.titleDark || 'Hero banner'}
              onClick={handleCta}
              className={`w-full max-w-[340px] md:max-w-[480px] aspect-square object-cover rounded-3xl ring-4 ring-rose-200/70 shadow-2xl shadow-rose-900/20 ${link ? 'cursor-pointer' : ''}`}
              loading="eager"
              draggable="false"
            />
          </div>
        )}

        <div className="text-center md:text-left md:col-start-1 md:row-start-2 md:self-start">
          {(slide.ctaLabel || slide.ctaNote) && (
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5">
              {slide.ctaLabel && (
                <button
                  type="button"
                  onClick={handleCta}
                  className="inline-flex items-center gap-3 pl-2 pr-8 py-2 rounded-full bg-gradient-to-r from-[#5a1426] to-[#a51d3a] hover:from-[#6b1830] hover:to-[#be2446] text-white shadow-xl shadow-rose-900/20 transition cursor-pointer active:scale-95"
                >
                  <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="20" r="1.4" />
                      <circle cx="18" cy="20" r="1.4" />
                      <path d="M2.5 3.5h2.7l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1" />
                    </svg>
                  </span>
                  <span className="text-lg lg:text-xl font-extrabold font-['Plus_Jakarta_Sans']">{slide.ctaLabel}</span>
                </button>
              )}

              {slide.ctaNote && (
                <div className="text-sm font-semibold text-[#5a2a35] leading-snug">{slide.ctaNote}</div>
              )}
            </div>
          )}

          {slide.footnote && <p className="mt-4 md:mt-6 text-xs text-slate-500">{slide.footnote}</p>}
        </div>
      </div>
    </section>
  );
}
