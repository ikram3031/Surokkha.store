import { SectionBackground } from '@/components/SectionBackground'

export const tips = [
  {
    title: 'Check the expiry date',
    desc: 'Do not use a pack once the expiry date printed on it has passed.',
  },
  {
    title: 'Choose the right lubricant',
    desc: 'Use water or silicone based lubricant with latex condoms. Anything oil based can damage the condom.',
  },
  {
    title: 'Store in a cool, dry place',
    desc: 'Keeping condoms in a wallet or car for long periods exposes them to heat and damages them.',
  },
]

export function SafeUse() {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <SectionBackground name="safe-use" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold leading-snug">
            Three things to know about safe use
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Condoms only protect fully when used correctly. Keep these in mind before you buy
            and before you use.
          </p>
        </div>
        <ol className="space-y-4">
          {tips.map((tip) => (
            <li key={tip.title} className="rounded-2xl bg-background p-5">
              <h3 className="font-semibold">{tip.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{tip.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
