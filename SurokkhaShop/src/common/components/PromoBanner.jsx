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
      className="group block w-full !mt-0 overflow-hidden bg-[#0b0a0e] [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <div className="flex w-max animate-marquee [animation-duration:50s] group-hover:[animation-play-state:paused] motion-reduce:animate-none h-[60px] md:h-[80px] items-center">
        {[0, 1].map((half) => (
          <p key={half} aria-hidden={half === 1 || undefined} className="flex shrink-0 items-center whitespace-nowrap text-[28px] leading-none md:text-[40px] font-semibold text-[#e6c27a] tracking-wide">
            {Array.from({ length: REPEAT }).map((_, r) => (
              <span key={r} aria-hidden={r > 0 || undefined} className="flex items-center">
                {banner.text}
                <span aria-hidden className="ml-5 rounded-full bg-[#e6c27a] px-4 py-1.5 text-sm font-bold tracking-normal text-[#1a1208] shadow-[0_0_14px_rgba(230,194,122,0.45)] md:px-5 md:py-2 md:text-lg">রেজিস্টার →</span>
                <span aria-hidden className="mx-10 text-[#e6c27a]/50">✦</span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </a>
  );
}
