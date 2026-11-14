import { Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSectionBackground } from '@/hooks/useSectionBackground'
import { L } from '@/lib/i18n'

// Shown until a hero image is set in the dashboard (CMS → Section Backgrounds → "Home hero")
const FALLBACK_IMAGE = '/banners/trial-pack-packets.webp'

// Scrolls to the first product section right under the hero
const scrollToProducts = () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })

// Home hero: the November Flash Sale offer beside the product image, products start right after it
export const HomeHero = () => {
  const cmsImage = useSectionBackground('hero')

  return (
    <section className="relative overflow-hidden [background:radial-gradient(circle_at_78%_28%,var(--accent)_0%,var(--secondary)_38%,var(--background)_72%)]">
      {/* Mobile: one sale card, the offer on the left and the product image tucked into the corner */}
      <div className="px-4 py-4 md:hidden">
        <div className="relative overflow-hidden rounded-3xl bg-header text-white shadow-lg">
          {/* Product image fills the card, with a black overlay so the text stays readable */}
          <img src={cmsImage ?? FALLBACK_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" aria-hidden="true" />
          <div className="relative p-5 py-7">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
              <Zap className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              {L('Limited time offer', 'সীমিত সময়ের অফার')}
            </p>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-tight">{L('November Flash Sale', 'নভেম্বর ফ্ল্যাশ সেল')}</h1>
            <div className="mt-2 flex items-end gap-2.5">
              <span className="font-display text-7xl font-bold leading-none text-amber-300">{L('30%', '৩০%')}</span>
              <span className="pb-1.5 text-lg font-semibold leading-tight">
                {L('up to', 'পর্যন্ত')}
                <br />
                {L('off', 'ছাড়')}
              </span>
            </div>
            <Button className="mt-5 h-11 rounded-full px-7 text-[15px] font-bold" onClick={scrollToProducts}>
              {L('Shop the sale', 'অফার দেখুন')}
            </Button>
          </div>
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-emerald-600/20 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
          <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {L('Free delivery on orders over ৳1,000', '১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি')}
        </p>
      </div>

      <div className="mx-auto hidden md:grid max-w-7xl items-center gap-5 px-4 py-6 md:gap-8 md:py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:py-14">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-sm">
            <Zap className="h-4 w-4 fill-current" aria-hidden="true" />
            {L('November Flash Sale', 'নভেম্বর ফ্ল্যাশ সেল')}
          </span>

          <p className="mt-3 font-display font-bold leading-[1.05] tracking-tight">
            <span className="block text-5xl text-primary sm:text-7xl lg:text-8xl">{L('Up to 30%', '৩০% পর্যন্ত')}</span>
            <span className="mt-1 block text-3xl sm:text-5xl lg:text-6xl">{L('off this month', 'ছাড় চলছে')}</span>
          </p>

          <p className="mt-5 hidden max-w-md text-lg sm:block leading-relaxed text-muted-foreground">
            {L('Discounts on most products, all of November.', 'পুরো নভেম্বর জুড়ে বেশিরভাগ প্রোডাক্টে ছাড়।')}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-7">
            <Button size="lg" className="h-12 rounded-full px-9 text-base font-semibold shadow-md" onClick={scrollToProducts}>
              {L('Shop the sale', 'অফার দেখুন')}
            </Button>
            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-emerald-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <Truck className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              {L('Free delivery over ৳1,000', '১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি')}
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[16/10] max-h-[420px] w-full sm:aspect-[5/4] overflow-hidden rounded-[28px]">
            <img src={cmsImage ?? FALLBACK_IMAGE} alt="" className={`h-full w-full ${cmsImage ? 'object-cover' : 'object-contain'}`} fetchPriority="high" />
          </div>
          {/* Offer seal on the image corner */}
          <div className="absolute -left-2 top-3 flex h-24 w-24 rotate-[-10deg] flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background sm:h-28 sm:w-28">
            <span className="font-display text-3xl font-bold leading-none sm:text-4xl">{L('30%', '৩০%')}</span>
            <span className="mt-0.5 text-xs font-semibold sm:text-sm">{L('OFF', 'ছাড়')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
