import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { SITE_CONFIG } from '../config/siteConfig';

const API_BASE_URL = SITE_CONFIG.apiBaseUrl.replace(/\/$/, '');
const CACHE_KEY = 'cms_banner_carousel_v1';

const resolveImage = (path) => (!path ? '' : /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`);

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
};
const writeCache = (v) => {
  try { if (v) localStorage.setItem(CACHE_KEY, JSON.stringify(v)); else localStorage.removeItem(CACHE_KEY); } catch {}
};

// Container-width image carousel for the home page.
// Images come from the dashboard CMS "slider" (page home, site shop). One image = static banner, several = carousel.
export default function BannerCarousel() {
  const navigateTo = useStore((state) => state.navigateTo);
  const navigateToCombo = useStore((state) => state.navigateToCombo);
  const openProduct = useStore((state) => state.openProduct);
  const [cms, setCms] = useState(() => readCache());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/v1/cms-content?type=slider&page=home&site=shop`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('cms fetch failed'))))
      .then((json) => {
        const doc = json?.data?.items?.length ? json.data : null;
        writeCache(doc);
        setCms(doc);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const slides = (cms?.items || []).filter((i) => i.image);
  const count = slides.length;
  const speedMs = Number(cms?.settings?.speedMs) || 5000;
  const autoplay = cms?.settings?.autoplay !== false;

  useEffect(() => {
    if (count < 2 || !autoplay) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), speedMs);
    return () => clearInterval(id);
  }, [count, autoplay, speedMs, index]);

  if (!count) return null;
  const current = index % count;

  const handleClick = (slide) => {
    const link = (slide.ctaLink || '').trim();
    if (!link) return;
    if (link === 'shop') return navigateTo('shop');
    if (link === 'combo') return navigateToCombo();
    if (/^https?:\/\//.test(link) || link.startsWith('/')) { window.location.href = link; return; }
    openProduct(link);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div
              key={s._id || i}
              onClick={() => handleClick(s)}
              className={`w-full flex-shrink-0 ${s.ctaLink ? 'cursor-pointer' : ''}`}
            >
              <img
                src={resolveImage(s.image)}
                alt={s.imageAlt || s.titleDark || 'Banner'}
                className="w-full h-auto block"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : undefined}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => setIndex((current - 1 + count) % count)}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 text-xl shadow flex items-center justify-center cursor-pointer">‹</button>
            <button type="button" aria-label="Next" onClick={() => setIndex((current + 1) % count)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 text-xl shadow flex items-center justify-center cursor-pointer">›</button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_, i) => (
                <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
