import { useState } from 'react'
import { LogoMark } from '@/components/icons/ArtIcons'
import { useSectionBackground } from '@/hooks/useSectionBackground'

const tabs = [
  {
    label: 'Products',
    text: 'Condoms, lubricants and intimate care from trusted brands. Every product page tells you what is inside and how to use it.',
  },
  {
    label: 'Delivery',
    text: 'Plain packaging with nothing on the outside to give it away. Pay on delivery: 1 day in Dhaka and 2–3 days nationwide.',
  },
  {
    label: 'Support',
    text: 'Questions? Message us on WhatsApp and we will answer in plain language. For anything medical, we will point you to a doctor.',
  },
]

/** "Care without judgement": CMS image on the left, big tab labels on the right. */
export function CareTabs() {
  const image = useSectionBackground('care')
  const [active, setActive] = useState(0)

  return (
    <section className="bg-accent/40 py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-stretch gap-10 px-4 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-[28px] bg-secondary ring-1 ring-border">
          {image ? (
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary/15">
              <LogoMark className="h-1/2 w-1/2" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="max-w-sm font-display text-3xl font-bold leading-snug">Care without judgement</h2>

          <div role="tablist" aria-label="How we help" className="mt-8 space-y-1 lg:mt-10">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                id={`care-tab-${i}`}
                role="tab"
                type="button"
                aria-selected={active === i}
                aria-controls="care-panel"
                onClick={() => setActive(i)}
                className={`block text-left font-display text-3xl font-bold transition-colors duration-300 md:text-4xl ${
                  active === i ? 'text-foreground' : 'text-foreground/30 hover:text-foreground/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p
            id="care-panel"
            role="tabpanel"
            aria-labelledby={`care-tab-${active}`}
            key={active}
            className="mt-8 max-w-md animate-in fade-in text-[15px] leading-relaxed text-muted-foreground duration-500 lg:mt-auto lg:pt-12"
          >
            {tabs[active].text}
          </p>
        </div>
      </div>
    </section>
  )
}
