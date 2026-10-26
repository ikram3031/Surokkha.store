import React, { useEffect, useRef, useState } from 'react';
import TrialPackHero from './TrialPackHero';
import UltimateComboHero from './UltimateComboHero';
import ProtectionComboHero from './ProtectionComboHero';
import CmsHeroSlide from './CmsHeroSlide';
import { SITE_CONFIG } from '../config/siteConfig';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl.replace(/\/$/, '');
const CACHE_KEY = 'cms_hero_slider_v1';
const DEFAULT_SETTINGS = { autoplay: true, speedMs: 5000, transitionMs: 700, pauseOnHover: true, showArrows: true, showDots: true };

// Built-in coded banners, shown only when the dashboard has no slider saved (or the API is unreachable).
const FALLBACK_SLIDES = [
  { key: 'trial-pack', Component: TrialPackHero },
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
export default function HeroBannerSlider() {
  const [active, setActive] = useState(0);
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
  const slides = cms
    ? cms.items.map((item, i) => ({ key: item._id || `cms-${i}`, render: () => <CmsHeroSlide slide={item} /> }))
    : FALLBACK_SLIDES.map(({ key, Component }) => ({ key, render: () => <Component /> }));

  const slideCount = slides.length;
  const current = active % slideCount;

  useEffect(() => {
    if (slideCount <= 1 || !settings.autoplay || (settings.pauseOnHover && isPaused)) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slideCount), settings.speedMs);
    return () => clearInterval(id);
  }, [slideCount, isPaused, settings.autoplay, settings.pauseOnHover, settings.speedMs]);

  const goTo = (index) => setActive((index + slideCount) % slideCount);

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
    goTo(deltaX < 0 ? current + 1 : current - 1);
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
        style={{ transform: `translateX(-${current * 100}%)`, transitionProperty: 'transform', transitionDuration: `${settings.transitionMs}ms` }}
      >
        {slides.map(({ key, render }, i) => (
          <div key={key} className="w-full flex-shrink-0 flex" inert={current !== i}>
            {render()}
          </div>
        ))}
      </div>

      {slideCount > 1 && (
        <>
          {settings.showArrows && (
          <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="hidden 2xl:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-[#5a1426] shadow-md items-center justify-center text-2xl cursor-pointer transition"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
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
