import { Check, PackageCheck } from 'lucide-react'
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
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.25fr_1fr] lg:pb-24 lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Safe today, tomorrow too
          </p>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Safe love,
            <br />
            <span className="text-primary">without hesitation.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Condoms, lubricants and intimate care from trusted brands. Order from home and get it delivered in plain
            packaging.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded-full px-8 text-base" onClick={() => scrollToId('on-sale')}>
              Shop products
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full bg-card/80 px-8 text-base backdrop-blur"
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
          <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-[28px] bg-accent shadow-xl shadow-primary/10 ring-1 ring-border">
            {cmsImage ? (
              <img src={image} alt="" className="h-full w-full object-cover" fetchPriority="high" />
            ) : (
              <img src={image} alt="" className="h-full w-full object-contain p-6" fetchPriority="high" />
            )}
          </div>

          <div className="absolute -bottom-5 left-3 flex max-w-[250px] items-start gap-3 rounded-2xl bg-card p-4 shadow-lg ring-1 ring-border sm:-left-6 sm:bottom-10">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Plain packaging</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Nothing on the box gives away what is inside.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
