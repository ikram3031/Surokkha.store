import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: 'প্যাকেজিং কি সত্যিই গোপন থাকবে?',
    a: 'হ্যাঁ। পণ্য সাদামাটা প্যাকেটে পাঠানো হয়, বাইরে কোনো পণ্যের নাম বা ছবি থাকে না। ইনভয়েসে শুধু "সুরক্ষা" নাম থাকে।',
  },
  {
    q: 'ক্যাশ অন ডেলিভারি আছে কি?',
    a: 'আছে। চাইলে বিকাশ বা নগদে আগেই পেমেন্ট করতে পারেন।',
  },
  {
    q: 'আমার ফোন নম্বর ও ঠিকানা কি নিরাপদ থাকবে?',
    a: 'আপনার তথ্য শুধু ডেলিভারির কাজে ব্যবহার করা হয় এবং কারো সাথে শেয়ার করা হয় না।',
  },
  {
    q: 'পণ্যে সমস্যা থাকলে কী করব?',
    a: 'প্যাকেট খোলা না হয়ে থাকলে এবং ডেলিভারির ২৪ ঘণ্টার মধ্যে জানালে আমরা বদলে দেব। হেল্পলাইনে ফোন বা হোয়াটসঅ্যাপ করুন।',
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="font-display text-3xl font-bold">সচরাচর জিজ্ঞাসা</h2>
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
