import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SectionHeading } from '@/components/SectionHeading'

export const faqs = [
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
    a: 'Message us on WhatsApp within 24 hours of delivery with your order number and a photo or short video. We will check it and let you know the next step.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Usually 1 day inside Dhaka and 2–3 days in the rest of Bangladesh. The delivery charge for your area is shown at checkout before you confirm.',
  },
  {
    q: 'Do I need to pay in advance?',
    a: 'No. Most customers pay cash on delivery. Paying in advance with bKash or Nagad is optional.',
  },
  {
    q: 'Will you call me to confirm my order?',
    a: 'Yes. We confirm every order with you before it is sent, so please keep your phone nearby after ordering.',
  },
  {
    q: 'Are the products genuine?',
    a: 'Yes. Every product is genuine and sealed in the manufacturer’s packaging. We only stock trusted brands.',
  },
  {
    q: 'Can I return a product?',
    a: 'Returns need our approval first, and the customer pays the return delivery charge. Damaged or used packs, Trial Packs, Smart Packs and loose-piece products cannot be returned. See the Return & Refund Policy for details.',
  },
  {
    q: 'How do I track my order?',
    a: 'We send delivery updates by SMS or WhatsApp. You can also message us any time with your order number.',
  },
  {
    q: 'Can I cancel or change my order?',
    a: 'Yes, as long as it has not been sent. Message us on WhatsApp as soon as possible with your order number.',
  },
  {
    q: 'How should I store the products?',
    a: 'Keep them in a cool, dry place away from direct sunlight and heat, and check the expiry date on the pack before use.',
  },
  {
    q: 'Do I need an account to order?',
    a: 'No. You can check out without one. An account just saves you typing your details next time.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
      <SectionHeading title="Frequently asked questions" />
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
