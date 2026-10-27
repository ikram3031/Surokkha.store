import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: 'Will the packaging really be discreet?',
    a: 'Yes. Products ship in plain packaging with no product name or image on the outside. The invoice only shows "Surokkha".',
  },
  {
    q: 'Is cash on delivery available?',
    a: 'Yes. You can also pay in advance with bKash or Nagad if you prefer.',
  },
  {
    q: 'Will my phone number and address stay private?',
    a: 'Your details are used only for delivery and are never shared with anyone.',
  },
  {
    q: 'What if there is a problem with my order?',
    a: 'If the pack is unopened and you tell us within 24 hours of delivery, we will replace it. Message us on WhatsApp.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="font-display text-3xl font-bold">Frequently asked questions</h2>
      <Accordion type="single" collapsible className="mt-8 rounded-3xl border border-border bg-card px-5">
        {faqs.map((item, i) => (
          <AccordionItem key={item.q} value={`item-${i}`}>
            <AccordionTrigger className="font-semibold">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
