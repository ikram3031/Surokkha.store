import { Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSectionBackground } from '@/hooks/useSectionBackground'
import { L } from '@/lib/i18n'

// Shown until a hero image is set in the dashboard (CMS → Section Backgrounds → "Home hero")
const FALLBACK_IMAGE = '/banners/trial-pack-packets.webp'

// Scrolls to the first product section right under the hero
const scrollToProducts = () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })

// Home hero: unified full-container-width banner across mobile and desktop, plus delivery notice
export const HomeHero = () => {
  const cmsImage = useSectionBackground('hero')

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2 md:pt-6 md:pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-header text-white shadow-lg">
          <img src={cmsImage ?? FALLBACK_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" aria-hidden="true" />
          <div className="relative p-5 py-7 md:p-10 md:py-12 lg:p-12 lg:py-14">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur md:text-sm">
              <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              {L('Limited time offer', 'সীমিত সময়ের অফার')}
            </p>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-tight md:text-4xl lg:text-5xl">
              {L('November Flash Sale', 'নভেম্বর ফ্ল্যাশ সেল')}
            </h1>
            <div className="mt-2 flex items-end gap-2.5 md:mt-3">
              <span className="font-display text-7xl font-bold leading-none text-amber-300 md:text-8xl">{L('30%', '৩০%')}</span>
              <span className="pb-1.5 text-lg font-semibold leading-tight md:text-2xl">
                {L('up to', 'পর্যন্ত')}
                <br />
                {L('off', 'ছাড়')}
              </span>
            </div>
            <Button className="mt-5 h-11 rounded-full px-7 text-[15px] font-bold md:mt-7 md:h-12 md:px-9 md:text-base" onClick={scrollToProducts}>
              {L('Shop the sale', 'অফার দেখুন')}
            </Button>
          </div>
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-[#1c0c13] px-4 py-2.5 text-sm font-semibold text-amber-200 shadow-xs">
          <Truck className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          {L('Free delivery on orders over ৳1,000', '১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি')}
        </p>
      </div>
    </section>
  )
}
