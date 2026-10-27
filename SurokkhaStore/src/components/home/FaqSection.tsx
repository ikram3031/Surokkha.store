import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { faqs } from '@/components/Faq'

/** Common questions in a white card on a soft blush band. */
export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-accent/40 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Common questions</h2>
        <Accordion type="single" collapsible className="mt-10 rounded-2xl bg-card px-6 shadow-xs">
          {faqs.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="py-5 text-base font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
