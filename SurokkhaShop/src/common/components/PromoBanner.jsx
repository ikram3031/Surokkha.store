import React, { useEffect, useState } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';

const API_ORIGIN = (SITE_CONFIG.apiBaseUrl || 'https://api.surokkha.store').replace(/\/$/, '');
const mediaUrl = (src) => (!src ? '' : /^(https?:|data:)/.test(src) ? src : `${API_ORIGIN}/${String(src).replace(/^\//, '')}`);

// Dashboard → Promotions → Promo banner, shown at the top of the home page while it is on
export default function PromoBanner() {
  const [banner, setBanner] = useState(null);

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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <Wrapper {...(banner.link ? { href: banner.link } : {})} className="relative block overflow-hidden rounded-2xl bg-rose-50">
        {image && <img src={image} alt={banner.text || 'Promotion'} className="block w-full object-cover" />}
        {banner.text && (
          <p
            className={
              image
                ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-center text-sm sm:text-base font-bold text-white'
                : 'px-4 py-3 text-center text-sm sm:text-base font-bold text-rose-800'
            }
          >
            {banner.text}
          </p>
        )}
      </Wrapper>
    </section>
  );
}
