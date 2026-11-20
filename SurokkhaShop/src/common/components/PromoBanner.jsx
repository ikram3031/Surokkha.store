import React, { useEffect, useState } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { useStore } from '../store/useStore';

const API_ORIGIN = (SITE_CONFIG.apiBaseUrl || 'https://api.surokkha.store').replace(/\/$/, '');
const mediaUrl = (src) => (!src ? '' : /^(https?:|data:)/.test(src) ? src : `${API_ORIGIN}/${String(src).replace(/^\//, '')}`);

// Each half of the marquee track repeats the text enough to be wider than any screen
const REPEAT = 6;

// Dashboard → Promotions → Promo banner: image card, or a dark scrolling bar when it is text only
export default function PromoBanner() {
  const [banner, setBanner] = useState(null);
  const navigateTo = useStore((state) => state.navigateTo);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_ORIGIN}/api/v1/promo`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setBanner(json?.data?.banner || null))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!banner) return null;
  const image = mediaUrl(banner.imageUrl);
  const Wrapper = banner.link ? 'a' : 'div';

  if (image) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Wrapper {...(banner.link ? { href: banner.link } : {})} className="relative block overflow-hidden rounded-2xl bg-rose-50">
          <img src={image} alt={banner.text || 'Promotion'} className="block w-full object-cover" />
          {banner.text && (
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-center text-sm sm:text-base font-bold text-white">
              {banner.text}
            </p>
          )}
        </Wrapper>
      </section>
    );
  }
  if (!banner.text) return null;

  return (
    <a
      href={banner.link || '/register'}
      onClick={(e) => {
        if (banner.link) return;
        e.preventDefault();
        navigateTo('account', 'signup');
      }}
      className="group block w-full !mt-0 overflow-hidden bg-[#0b0a0e] text-rose-50/85 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <div className="flex w-max animate-marquee [animation-duration:50s] group-hover:[animation-play-state:paused] motion-reduce:animate-none py-3">
        {[0, 1].map((half) => (
          <p key={half} aria-hidden={half === 1 || undefined} className="flex shrink-0 items-center whitespace-nowrap text-sm sm:text-[15px] font-medium tracking-wide">
            {Array.from({ length: REPEAT }).map((_, r) => (
              <span key={r} aria-hidden={r > 0 || undefined} className="flex items-center">
                {banner.text}
                <span aria-hidden className="mx-8 text-rose-300/60">•</span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </a>
  );
}
