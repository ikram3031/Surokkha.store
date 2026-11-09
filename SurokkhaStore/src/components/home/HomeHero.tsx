import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSectionBackground } from '@/hooks/useSectionBackground'

const perks = ['Cash on delivery', '100% genuine products', 'Plain, discreet packaging']

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
            Safe love,
            <br />
            <span className="text-primary">without hesitation.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Condoms, lubricants and intimate care from trusted brands. Order from home and get it delivered in plain
            packaging.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded-full px-8 text-base" onClick={() => scrollToId('featured')}>
              Shop products
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-2 border-link bg-card/80 px-8 text-base font-semibold text-link backdrop-blur hover:bg-link hover:text-link-foreground"
              onClick={() => scrollToId('delivery')}
            >
              How it works
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
