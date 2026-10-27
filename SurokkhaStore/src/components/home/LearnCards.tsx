import { SectionBackground } from '@/components/SectionBackground'
import { tips } from '@/components/SafeUse'

/** "Learn with confidence": the safe-use tips as three numbered cards. */
export function LearnCards() {
  return (
    <section className="relative overflow-hidden bg-background">
      <SectionBackground name="safe-use" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Learn with confidence</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Condoms only protect fully when used correctly. Keep these three things in mind before you buy and before you
          use.
        </p>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {tips.map((tip, i) => (
            <li
              key={tip.title}
              className="rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold leading-snug">{tip.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tip.desc}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-xs text-muted-foreground">
          This is general information and does not replace advice from a doctor.
        </p>
      </div>
    </section>
  )
}
