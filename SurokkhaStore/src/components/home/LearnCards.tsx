import { SectionBackground } from '@/components/SectionBackground'
import { tips } from '@/components/SafeUse'
import { SectionHeading } from '@/components/SectionHeading'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'

/** "Learn with confidence": the safe-use tips as three numbered cards. */
export function LearnCards() {
  return (
    <section className="relative overflow-hidden bg-background">
      <SectionBackground name="safe-use" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <SectionHeading
          title={L('Learn with confidence', 'নিশ্চিন্তে জানুন')}
          subtitle={L('Condoms only protect fully when used correctly. Keep these three things in mind before you buy and before you use.', 'সঠিকভাবে ব্যবহার করলেই কনডম পুরোপুরি সুরক্ষা দেয়। কেনার ও ব্যবহারের আগে এই ৩টি বিষয় মনে রাখুন।')}
        />

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {tips.map((tip, i) => (
            <li
              key={tip.title}
              className="rounded-2xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-primary">
                {bn(i + 1)}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold leading-snug">{tip.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tip.desc}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-xs text-muted-foreground">
          {L('This is general information and does not replace advice from a doctor.', 'এটি সাধারণ তথ্য, ডাক্তারের পরামর্শের বিকল্প নয়।')}
        </p>
      </div>
    </section>
  )
}
