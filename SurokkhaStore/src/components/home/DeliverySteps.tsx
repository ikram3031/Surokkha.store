import { SectionHeading } from '@/components/SectionHeading'
import { bn } from '@/lib/bn'
import { L } from '@/lib/i18n'

const steps = [
  {
    title: L('Order online', 'অনলাইনে অর্ডার করুন'),
    text: L('Check out as a guest, no account needed. Cash on delivery is available.', 'অ্যাকাউন্ট ছাড়াই গেস্ট হিসেবে অর্ডার করুন। ক্যাশ অন ডেলিভারি সুবিধা আছে।'),
  },
  {
    title: L('We pack it plainly', 'আমরা সাধারণ প্যাকেটে পাঠাই'),
    text: L('A plain box with nothing on the outside about what is inside.', 'সাধারণ বক্স, বাইরে ভেতরের পণ্যের কোনো উল্লেখ থাকে না।'),
  },
  {
    title: L('Delivered to you', 'আপনার কাছে ডেলিভারি'),
    text: L('1 day in Dhaka and 2–3 days nationwide. Pay when it arrives.', 'ঢাকায় ১ দিনে, সারা দেশে ২–৩ দিনে। হাতে পেয়ে টাকা দিন।'),
  },
]

/** Band explaining the discreet delivery in three steps. */
export function DeliverySteps() {
  return (
    <section id="delivery" className="scroll-mt-20 bg-background py-16 text-foreground md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          title={L('How private delivery works', 'গোপনীয় ডেলিভারি যেভাবে হয়')}
          subtitle={L('From checkout to your door, nobody else needs to know what you ordered.', 'অর্ডার থেকে দরজা পর্যন্ত, আপনি কী অর্ডার করেছেন তা আর কেউ জানবে না।')}
        />

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t border-foreground/20 pt-6">
              <span className="text-sm font-semibold text-brand-accent">{L('Step', 'ধাপ')} {bn(i + 1)}</span>
              <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
