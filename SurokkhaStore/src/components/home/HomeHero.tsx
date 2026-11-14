import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSectionBackground } from '@/hooks/useSectionBackground'
import { L } from '@/lib/i18n'

const perks = [L('Cash on delivery', 'ক্যাশ অন ডেলিভারি'), L('100% genuine products', '১০০% আসল প্রোডাক্ট'), L('Plain, discreet packaging', 'সাধারণ, গোপনীয় প্যাকেজিং')]

// Shown until a hero image is set in the dashboard (CMS → Section Backgrounds → "Home hero")
const FALLBACK_IMAGE = '/banners/trial-pack-packets.webp'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function HomeHero() {
  const cmsImage = useSectionBackground('hero')
  const image = cmsImage ?? FALLBACK_IMAGE

  return (
    <section className="relative overflow-hidden [background:radial-gradient(circle_at_78%_28%,var(--accent)_0%,var(--secondary)_38%,var(--background)_72%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 md:pt-12 lg:grid-cols-[1.25fr_1fr] lg:pb-14 lg:pt-14">
        <div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {L('Safe love,', 'নিরাপদ ভালোবাসা,')}
            <br />
            <span className="text-primary">{L('without hesitation.', 'কোনো দ্বিধা ছাড়াই।')}</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            {L('Condoms, lubricants and intimate care from trusted brands. Order from home and get it delivered in plain packaging.', 'বিশ্বস্ত ব্র্যান্ডের কনডম, লুব্রিকেন্ট ও ব্যক্তিগত যত্নের পণ্য। ঘরে বসে অর্ডার করুন, সাধারণ প্যাকেটে ডেলিভারি পান।')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded-full px-8 text-base" onClick={() => scrollToId('featured')}>
              {L('Shop products', 'প্রোডাক্ট দেখুন')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-2 border-link bg-card/80 px-8 text-base font-semibold text-link backdrop-blur hover:bg-link hover:text-link-foreground"
              onClick={() => scrollToId('delivery')}
            >
              {L('How it works', 'কীভাবে কাজ করে')}
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] max-h-[460px] w-full overflow-hidden rounded-[28px]">
            {cmsImage ? (
              <img src={image} alt="" className="h-full w-full object-cover" fetchPriority="high" />
            ) : (
              <img src={image} alt="" className="h-full w-full object-contain" fetchPriority="high" />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
