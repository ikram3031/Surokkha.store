import React, { useEffect, useRef, useState } from 'react';
import SmartPackHero from './SmartPackHero';
import UltimateComboHero from './UltimateComboHero';
import ProtectionComboHero from './ProtectionComboHero';
import CmsHeroSlide from './CmsHeroSlide';
import SurokkhaTrialPackHero from './SurokkhaTrialPackHero';
import { SITE_CONFIG } from '../config/siteConfig';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl.replace(/\/$/, '');
const CACHE_KEY = 'cms_hero_slider_v1';
const DEFAULT_SETTINGS = { autoplay: true, speedMs: 5000, transitionMs: 700, pauseOnHover: true, showArrows: true, showDots: true };

// Special Combo: 30 pieces MO Micro Ribbed Pack (product 6aeafa497b0cbb4ad68d387d)
const SPECIAL_COMBO_SLIDE = {
  badge: 'Special Combo',
  titleDark: '30 Pieces',
  titleAccent: 'MO Micro Ribbed',
  tagline: ['3 Full Boxes', 'Bundle Price'],
  subtitle: '৩০ পিস স্পেশাল কম্বো — বিশেষ ছাড়ে',
  chips: [{ label: 'Micro Ribbed', color: '#94a3b8' }, { label: '100% Confidential', color: '#e05578' }],
  image: '/uploads/2611/261104/special-combo-30-pieces-mo-micro-ribbed-pack_main_1793784339568.webp',
  imageAlt: 'Special Combo: 30 pieces MO Micro Ribbed Pack',
  ctaLabel: 'Order Now',
  ctaNote: '৳1000 (ছিল ৳1350)',
  ctaLink: 'special-combo-30-pieces-mo-micro-ribbed-pack',
  footnote: 'শুধুমাত্র প্রাপ্তবয়স্কদের জন্য (১৮+)',
};

// Built-in coded banners, shown only when the dashboard has no slider saved (or the API is unreachable).
const FALLBACK_SLIDES = [
  { key: 'surokkha-trial-pack', Component: SurokkhaTrialPackHero },
  { key: 'ultimate-combo', Component: UltimateComboHero },
  { key: 'protection-combo', Component: ProtectionComboHero },
];

// Reads the last CMS slider from localStorage so repeat visits render instantly
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
};

const writeCache = (value) => {
  try {
    if (value) localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    else localStorage.removeItem(CACHE_KEY);
  } catch {}
};

const SWIPE_THRESHOLD_PX = 50;

// Home hero slider. Slides, speed and display options come from the dashboard (CMSContent type "slider").
export default function HeroBannerSlider({ useCms = true }) {
  // pos runs 0..slideCount; slideCount is a clone of slide 0 so the last slide keeps sliding forward
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [cms, setCms] = useState(() => readCache());
  const [loaded, setLoaded] = useState(() => readCache() !== null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/v1/cms-content?type=slider&page=home&site=shop`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('cms fetch failed'))))
      .then((json) => {
        const doc = json?.data?.items?.length ? json.data : null;
        writeCache(doc);
        setCms(doc);
        setLoaded(true);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoaded(true);
      });
    return () => controller.abort();
  }, []);

  const settings = { ...DEFAULT_SETTINGS, ...(cms?.settings || {}) };
  const slides = useCms && cms
    ? cms.items.map((item, i) => ({ key: item._id || `cms-${i}`, render: () => <CmsHeroSlide slide={item} /> }))
    : FALLBACK_SLIDES.map(({ key, Component, props }) => ({ key, render: () => <Component {...props} /> }));

  const slideCount = slides.length;
  const current = pos % slideCount;

  const next = () => {
    setAnimate(true);
    setPos((p) => Math.min(p + 1, slideCount));
  };
  const prev = () => {
    if (pos === 0) {
      // jump (no animation) to the clone of slide 0, then slide back one to the last slide
      setAnimate(false);
      setPos(slideCount);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setAnimate(true);
        setPos(slideCount - 1);
      }));
    } else {
      setAnimate(true);
      setPos(pos - 1);
    }
  };
  const goTo = (index) => {
    setAnimate(true);
    setPos(((index % slideCount) + slideCount) % slideCount);
  };

  // After sliding onto the clone, snap back to the real first slide without animation
  const handleTransitionEnd = () => {
    if (pos === slideCount) {
      setAnimate(false);
      setPos(0);
    }
  };

  useEffect(() => {
    if (slideCount <= 1 || !settings.autoplay || (settings.pauseOnHover && isPaused)) return;
    const id = setInterval(next, settings.speedMs);
    return () => clearInterval(id);
  }, [slideCount, isPaused, settings.autoplay, settings.pauseOnHover, settings.speedMs]);

  // Touch swipe for phones
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const handleTouchEnd = (e) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);
    if (startX == null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) next(); else prev();
  };

  if (!loaded) return <section className="w-full min-h-[28rem]" aria-hidden="true" />;

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex ease-out"
        onTransitionEnd={handleTransitionEnd}
        style={{ transform: `translateX(-${pos * 100}%)`, transitionProperty: 'transform', transitionDuration: animate ? `${settings.transitionMs}ms` : '0ms' }}
      >
        {slides.map(({ key, render }, i) => (
          <div key={key} className="w-full flex-shrink-0 flex" inert={current !== i}>
            {render()}
          </div>
        ))}
        {slideCount > 1 && (
          <div key={`${slides[0].key}-clone`} className="w-full flex-shrink-0 flex" inert aria-hidden="true">
            {slides[0].render()}
          </div>
        )}
      </div>

      {slideCount > 1 && (
        <>
          {settings.showArrows && (
          <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="hidden 2xl:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-[#5a1426] shadow-md items-center justify-center text-2xl cursor-pointer transition"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="hidden 2xl:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-[#5a1426] shadow-md items-center justify-center text-2xl cursor-pointer transition"
          >
            ›
          </button>
          </>
          )}
          {settings.showDots && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map(({ key }, i) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${i === current ? 'w-7 bg-[#e05578]' : 'w-2.5 bg-slate-400/60 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          )}
        </>
      )}
    </section>
  );
}
