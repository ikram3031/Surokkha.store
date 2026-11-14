import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { faqs } from '@/components/Faq'
import { Breadcrumb } from '@/components/pages/PolicyPage'
import { L } from '@/lib/i18n'

/** Frequently asked questions (moved off the home page). */
export function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 lg:pt-8">
      <Breadcrumb current={L('FAQ', 'সাধারণ জিজ্ঞাসা')} />
      <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">{L('Frequently asked questions', 'সাধারণ জিজ্ঞাসা')}</h1>
      <p className="mt-3 text-muted-foreground">{L('Quick answers about packaging, payment, delivery and privacy.', 'প্যাকেজিং, পেমেন্ট, ডেলিভারি ও গোপনীয়তা নিয়ে দ্রুত উত্তর।')}</p>
      <Accordion type="single" collapsible className="mt-8 rounded-2xl bg-card px-6 shadow-xs ring-1 ring-border">
        {faqs.map((item, i) => (
          <AccordionItem key={item.q} value={`item-${i}`}>
            <AccordionTrigger className="py-5 text-base font-semibold">{item.q}</AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
