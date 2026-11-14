import { useEffect, useState } from 'react'
import { api, resolveMediaUrl } from '@/lib/api/client'
import { navigate } from '@/lib/router'
import { L } from '@/lib/i18n'

interface Promo {
  banner: { imageUrl: string; text: string; link: string } | null
}

/** Dashboard → Promotions → Promo banner, shown at the top of the home page while it is on. */
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

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4">
      <div
        role={banner.link ? 'link' : undefined}
        onClick={open}
        className={`relative overflow-hidden rounded-2xl bg-primary/10 ${banner.link ? 'cursor-pointer' : ''}`}
      >
        {image && <img src={image} alt={banner.text || L('Promotion', 'প্রমোশন')} className="block w-full object-cover" />}
        {banner.text && (
          <p
            className={
              image
                ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-center text-sm font-semibold text-white md:text-base'
                : 'px-4 py-3 text-center text-sm font-semibold md:text-base'
            }
          >
            {banner.text}
          </p>
        )}
      </div>
    </section>
  )
}
