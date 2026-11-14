import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SectionHeading } from '@/components/SectionHeading'
import { L } from '@/lib/i18n'

export const faqs = [
  {
    q: L('Will the packaging really be discreet?', 'প্যাকেজিং কি সত্যিই গোপনীয় হবে?'),
    a: L('Yes. Products ship in plain packaging with no product name or image on the outside. The invoice only shows "Surokkha".', 'হ্যাঁ। পণ্য সাধারণ প্যাকেটে পাঠানো হয়, বাইরে পণ্যের কোনো নাম বা ছবি থাকে না। ইনভয়েসে শুধু "Surokkha" লেখা থাকে।'),
  },
  {
    q: L('Is cash on delivery available?', 'ক্যাশ অন ডেলিভারি সুবিধা আছে কি?'),
    a: L('Yes. You can also pay in advance with bKash or Nagad if you prefer.', 'হ্যাঁ। চাইলে বিকাশ বা নগদে আগেও পেমেন্ট করতে পারেন।'),
  },
  {
    q: L('Will my phone number and address stay private?', 'আমার ফোন নম্বর ও ঠিকানা কি গোপন থাকবে?'),
    a: L('Your details are used only for delivery and are never shared with anyone.', 'আপনার তথ্য শুধু ডেলিভারির জন্য ব্যবহার হয়, কারো সাথে শেয়ার করা হয় না।'),
  },
  {
    q: L('What if there is a problem with my order?', 'অর্ডারে কোনো সমস্যা হলে কী করব?'),
    a: L('Message us on WhatsApp within 24 hours of delivery with your order number and a photo or short video. We will check it and let you know the next step.', 'ডেলিভারির ২৪ ঘণ্টার মধ্যে অর্ডার নম্বর ও একটি ছবি বা ছোট ভিডিওসহ হোয়াটসঅ্যাপে মেসেজ দিন। আমরা দেখে পরবর্তী ধাপ জানিয়ে দেব।'),
  },
  {
    q: L('How long does delivery take?', 'ডেলিভারি পেতে কত সময় লাগে?'),
    a: L('Usually 1 day inside Dhaka and 2–3 days in the rest of Bangladesh. The delivery charge for your area is shown at checkout before you confirm.', 'সাধারণত ঢাকার ভেতরে ১ দিন এবং দেশের অন্যান্য জায়গায় ২–৩ দিন। আপনার এলাকার ডেলিভারি চার্জ কনফার্ম করার আগে চেকআউটে দেখানো হয়।'),
  },
  {
    q: L('Do I need to pay in advance?', 'আগে টাকা দিতে হবে কি?'),
    a: L('No. Most customers pay cash on delivery. Paying in advance with bKash or Nagad is optional.', 'না। বেশিরভাগ গ্রাহক ক্যাশ অন ডেলিভারিতে পেমেন্ট করেন। বিকাশ বা নগদে আগে পেমেন্ট ঐচ্ছিক।'),
  },
  {
    q: L('Will you call me to confirm my order?', 'অর্ডার কনফার্ম করতে কি কল করবেন?'),
    a: L('Yes. We confirm every order with you before it is sent, so please keep your phone nearby after ordering.', 'হ্যাঁ। পাঠানোর আগে প্রতিটি অর্ডার আপনার সাথে কনফার্ম করা হয়, তাই অর্ডারের পর ফোন কাছে রাখুন।'),
  },
  {
    q: L('Are the products genuine?', 'প্রোডাক্টগুলো কি আসল?'),
    a: L('Yes. Every product is genuine and sealed in the manufacturer’s packaging. We only stock trusted brands.', 'হ্যাঁ। প্রতিটি পণ্য আসল এবং প্রস্তুতকারকের সিল করা প্যাকেটে থাকে। আমরা শুধু বিশ্বস্ত ব্র্যান্ডের পণ্য রাখি।'),
  },
  {
    q: L('Can I return a product?', 'প্রোডাক্ট কি রিটার্ন করা যায়?'),
    a: L('Returns need our approval first, and the customer pays the return delivery charge. Damaged or used packs, Trial Packs, Smart Packs and loose-piece products cannot be returned. See the Return & Refund Policy for details.', 'রিটার্নের জন্য আগে আমাদের অনুমোদন লাগবে এবং রিটার্ন ডেলিভারি চার্জ গ্রাহক বহন করবেন। ক্ষতিগ্রস্ত বা ব্যবহৃত প্যাক, ট্রায়াল প্যাক, স্মার্ট প্যাক ও খুচরা পিস রিটার্ন করা যায় না। বিস্তারিত রিটার্ন ও রিফান্ড পলিসিতে দেখুন।'),
  },
  {
    q: L('How do I track my order?', 'অর্ডার কীভাবে ট্র্যাক করব?'),
    a: L('We send delivery updates by SMS or WhatsApp. You can also message us any time with your order number.', 'আমরা এসএমএস বা হোয়াটসঅ্যাপে ডেলিভারির আপডেট পাঠাই। অর্ডার নম্বর দিয়ে যেকোনো সময় আমাদের মেসেজও দিতে পারেন।'),
  },
  {
    q: L('Can I cancel or change my order?', 'অর্ডার কি বাতিল বা পরিবর্তন করা যায়?'),
    a: L('Yes, as long as it has not been sent. Message us on WhatsApp as soon as possible with your order number.', 'হ্যাঁ, যতক্ষণ পাঠানো না হয়। যত দ্রুত সম্ভব অর্ডার নম্বরসহ হোয়াটসঅ্যাপে মেসেজ দিন।'),
  },
  {
    q: L('How should I store the products?', 'প্রোডাক্ট কীভাবে সংরক্ষণ করব?'),
    a: L('Keep them in a cool, dry place away from direct sunlight and heat, and check the expiry date on the pack before use.', 'সরাসরি রোদ ও তাপ থেকে দূরে ঠান্ডা, শুকনো জায়গায় রাখুন এবং ব্যবহারের আগে প্যাকের মেয়াদ দেখে নিন।'),
  },
  {
    q: L('Do I need an account to order?', 'অর্ডার করতে কি অ্যাকাউন্ট লাগবে?'),
    a: L('No. You can check out without one. An account just saves you typing your details next time.', 'না। অ্যাকাউন্ট ছাড়াই অর্ডার করতে পারেন। অ্যাকাউন্ট থাকলে পরের বার তথ্য আবার লিখতে হয় না।'),
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
      <SectionHeading title={L('Frequently asked questions', 'সাধারণ জিজ্ঞাসা')} />
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
