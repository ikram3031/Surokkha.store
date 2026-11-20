import { useEffect, useState } from 'react'
import { api, resolveMediaUrl } from '@/lib/api/client'
import { navigate } from '@/lib/router'
import { L } from '@/lib/i18n'

interface Promo {
  banner: { imageUrl: string; text: string; link: string } | null
}

// Each half of the marquee track repeats the text enough to be wider than any screen
const REPEAT = 6

// Text-only bar opens sign up when the dashboard gives it no link
const SIGNUP_PATH = '/account?view=signup'

/** Dashboard → Promotions → Promo banner: image card, or a dark scrolling bar right under the hero when it is text only. */
export function PromoBanner() {
  const [banner, setBanner] = useState<Promo['banner']>(null)

  useEffect(() => {
    const controller = new AbortController()
    api
      .get<{ data?: Promo }>('/promo', undefined, { signal: controller.signal })
      .then((res) => setBanner(res?.data?.banner ?? null))
      .catch(() => setBanner(null))
    return () => controller.abort()
  }, [])

  if (!banner) return null
  const image = resolveMediaUrl(banner.imageUrl)
  const open = () => {
    if (!banner.link) return
    if (/^https?:\/\//.test(banner.link)) window.location.href = banner.link
    else navigate(banner.link)
  }
  const openBar = () => (banner.link ? open() : navigate(SIGNUP_PATH))

  if (image) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div
          role={banner.link ? 'link' : undefined}
          onClick={open}
          className={`relative overflow-hidden rounded-2xl bg-primary/10 ${banner.link ? 'cursor-pointer' : ''}`}
        >
          <img src={image} alt={banner.text || L('Promotion', 'প্রমোশন')} className="block w-full object-cover" />
          {banner.text && (
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-center text-sm font-semibold text-white md:text-base">
              {banner.text}
            </p>
          )}
        </div>
      </section>
    )
  }
  if (!banner.text) return null

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openBar}
      onKeyDown={(e) => e.key === 'Enter' && openBar()}
      className={`group w-full overflow-hidden bg-header text-white/85 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] cursor-pointer`}
    >
      <div className="animate-marquee flex w-max py-3 [animation-duration:50s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((half) => (
          <p key={half} aria-hidden={half === 1 || undefined} className="flex shrink-0 items-center text-sm font-medium tracking-wide whitespace-nowrap md:text-[15px]">
            {Array.from({ length: REPEAT }).map((_, r) => (
              <span key={r} aria-hidden={r > 0 || undefined} className="flex items-center">
                {banner.text}
                <span aria-hidden className="mx-8 text-white/40">•</span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  )
}
