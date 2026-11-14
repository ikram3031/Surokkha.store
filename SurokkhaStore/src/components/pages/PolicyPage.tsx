import { navigate } from '@/lib/router'
import { L, LANG } from '@/lib/i18n'

interface Section {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

interface Policy {
  title: string
  intro: string
  sections: Section[]
}

const WHATSAPP = '+880 1600-905774'
const EMAIL = 'surokkha.store@gmail.com'

const POLICIES_EN: Record<'terms' | 'privacy' | 'refund', Policy> = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'Your privacy and the confidentiality of your order come first. We will never share, sell or disclose who you are or what you bought.',
    sections: [
      {
        title: 'Information we collect',
        paragraphs: ['We collect only what is needed to deliver your order:'],
        bullets: [
          'Contact details: your name, mobile number and, optionally, your email address.',
          'Delivery details: street address, district and thana / upazila.',
          'Order details: the items, quantities and any delivery note you add.',
          'Technical data: anonymous browsing logs and standard cookies that keep the site working.',
        ],
      },
      {
        title: 'How we use it',
        bullets: [
          'To pack and dispatch your order.',
          'To send delivery updates by SMS or WhatsApp.',
          'To contact you when an address or courier detail needs clarifying.',
          'To prevent fraudulent orders.',
        ],
        paragraphs: ['We do not make marketing calls or send spam.'],
      },
      {
        title: 'Couriers and discreet packaging',
        paragraphs: [
          'Parcels go out in plain, unmarked packaging. The courier slip shows only your name, phone number and address, with no product names, descriptions or logos.',
        ],
      },
      {
        title: 'Security and retention',
        paragraphs: [
          'Data is encrypted in transit (HTTPS) and stored with restricted access. We keep transaction records only as long as accounting and tax rules require.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          `Once your order has been delivered you can ask us to delete your order records, phone number and address. Message us on WhatsApp (${WHATSAPP}) or email ${EMAIL} with your order number or mobile number.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'Please read these terms before you place an order on Surokkha Store.',
    sections: [
      {
        title: 'Age requirement',
        paragraphs: [
          'By ordering you confirm that you are at least 18 years old. Our products are intended for adults only; we do not sell to minors.',
        ],
      },
      {
        title: 'Products',
        paragraphs: [
          'All products are genuine and sealed in the manufacturer’s packaging. Barrier contraceptives greatly reduce the risk of pregnancy and many infections, but no method is 100% effective. Always follow the instructions on the pack.',
        ],
      },
      {
        title: 'Orders, prices and delivery',
        paragraphs: [
          'Prices are in Bangladeshi Taka (৳). We may correct obvious pricing errors. The delivery charge for your area is shown at checkout before you confirm. Delivery usually takes 1 day in Dhaka and 2–3 days nationwide.',
        ],
      },
      {
        title: 'Cash on delivery and payment',
        paragraphs: [
          'You can pay in cash when the parcel arrives, or in advance with bKash or Nagad. If you order with cash on delivery, please be available to receive the parcel and pay the invoice amount. Repeatedly refusing parcels without a valid reason may lead to your number and address being blocked.',
        ],
      },
      {
        title: 'Medical information',
        paragraphs: [
          'Information on this site is general and does not replace advice from a doctor. We are not liable for harm caused by not following the product instructions.',
        ],
      },
      {
        title: 'Questions',
        paragraphs: [`Contact us on WhatsApp ${WHATSAPP} or at ${EMAIL}.`],
      },
    ],
  },
  refund: {
    title: 'Return & Refund Policy',
    intro:
      'Every order is confirmed with you before we send it. Because these are intimate-care products, returns are limited and must be approved by us first.',
    sections: [
      {
        title: 'Returns must be verified by us first',
        paragraphs: [
          `Please do not send anything back without telling us. Message us on WhatsApp (${WHATSAPP}) or email ${EMAIL} with your order number, phone number and a clear photo or short video. We will check the request and confirm whether the return is accepted. Parcels sent back without our approval will not be accepted or refunded.`,
        ],
      },
      {
        title: 'Return delivery charge',
        paragraphs: ['If a return is approved, the delivery charge for sending the product back is paid by the customer.'],
      },
      {
        title: 'Products we can accept back',
        bullets: [
          'The pack may be opened, but every inner packet must still be intact, sealed and unused.',
          'The product must be in its original condition, with no damage of any kind.',
          'The return is reported to us soon after delivery, within 24 hours.',
        ],
      },
      {
        title: 'Products we cannot take back',
        bullets: [
          'Any product that is damaged in any way.',
          'Packets that have been opened, torn, used or had their seal broken.',
          'Trial Packs, Smart Packs and any other product we sell as loose pieces: these have no returns.',
          'Change of mind once a pack has been opened.',
        ],
      },
      {
        title: 'If we sent the wrong item',
        paragraphs: [
          'If you received a different product or quantity from what you ordered, tell us within 24 hours with a photo or video. Once we verify it, we will arrange the correct item.',
        ],
      },
      {
        title: 'Refunds',
        paragraphs: [
          'When a return is approved and the product reaches us in the condition described above, the refund is paid to your bKash or Nagad within 2–5 working days. The return delivery charge is not refunded.',
        ],
      },
    ],
  },
}

const POLICIES_BN: Record<'terms' | 'privacy' | 'refund', Policy> = {
  privacy: {
    title: 'প্রাইভেসি পলিসি',
    intro: 'আপনার গোপনীয়তা ও অর্ডারের গোপনীয়তা আমাদের প্রথম অগ্রাধিকার। আপনি কে বা কী কিনেছেন তা আমরা কখনো শেয়ার, বিক্রি বা প্রকাশ করি না।',
    sections: [
      {
        title: 'আমরা যে তথ্য সংগ্রহ করি',
        paragraphs: ['অর্ডার ডেলিভারির জন্য যতটুকু দরকার, শুধু ততটুকুই সংগ্রহ করি:'],
        bullets: [
          'যোগাযোগের তথ্য: আপনার নাম, মোবাইল নম্বর এবং (ঐচ্ছিক) ইমেইল ঠিকানা।',
          'ডেলিভারির তথ্য: বিস্তারিত ঠিকানা, জেলা ও থানা / উপজেলা।',
          'অর্ডারের তথ্য: পণ্য, পরিমাণ এবং আপনার দেওয়া ডেলিভারি নোট।',
          'টেকনিক্যাল তথ্য: সাইট সচল রাখার জন্য বেনামি ব্রাউজিং লগ ও সাধারণ কুকি।',
        ],
      },
      {
        title: 'তথ্য যেভাবে ব্যবহার করি',
        bullets: [
          'আপনার অর্ডার প্যাক ও পাঠানোর জন্য।',
          'এসএমএস বা হোয়াটসঅ্যাপে ডেলিভারির আপডেট পাঠানোর জন্য।',
          'ঠিকানা বা কুরিয়ার সংক্রান্ত তথ্য নিশ্চিত করতে আপনার সাথে যোগাযোগের জন্য।',
          'ভুয়া অর্ডার প্রতিরোধের জন্য।',
        ],
        paragraphs: ['আমরা কোনো মার্কেটিং কল করি না বা স্প্যাম পাঠাই না।'],
      },
      {
        title: 'কুরিয়ার ও গোপনীয় প্যাকেজিং',
        paragraphs: [
          'পার্সেল সাধারণ, চিহ্নহীন প্যাকেটে পাঠানো হয়। কুরিয়ার স্লিপে শুধু আপনার নাম, ফোন নম্বর ও ঠিকানা থাকে; পণ্যের নাম, বিবরণ বা লোগো থাকে না।',
        ],
      },
      {
        title: 'নিরাপত্তা ও তথ্য সংরক্ষণ',
        paragraphs: [
          'তথ্য আদান-প্রদানের সময় এনক্রিপ্ট করা থাকে (HTTPS) এবং সীমিত অ্যাক্সেসে সংরক্ষিত হয়। হিসাব ও কর সংক্রান্ত নিয়মে যতদিন দরকার, শুধু ততদিনই লেনদেনের রেকর্ড রাখি।',
        ],
      },
      {
        title: 'আপনার অধিকার',
        paragraphs: [
          `অর্ডার ডেলিভারি হয়ে গেলে আপনি আপনার অর্ডারের রেকর্ড, ফোন নম্বর ও ঠিকানা মুছে ফেলতে বলতে পারেন। অর্ডার নম্বর বা মোবাইল নম্বরসহ হোয়াটসঅ্যাপে (${WHATSAPP}) মেসেজ দিন বা ${EMAIL}-এ ইমেইল করুন।`,
        ],
      },
    ],
  },
  terms: {
    title: 'শর্তাবলী',
    intro: 'সুরক্ষা স্টোরে অর্ডার করার আগে অনুগ্রহ করে এই শর্তাবলী পড়ে নিন।',
    sections: [
      {
        title: 'বয়সসীমা',
        paragraphs: [
          'অর্ডার করার মাধ্যমে আপনি নিশ্চিত করছেন যে আপনার বয়স কমপক্ষে ১৮ বছর। আমাদের পণ্য শুধুমাত্র প্রাপ্তবয়স্কদের জন্য; অপ্রাপ্তবয়স্কদের কাছে আমরা বিক্রি করি না।',
        ],
      },
      {
        title: 'প্রোডাক্ট',
        paragraphs: [
          'সব পণ্য আসল এবং প্রস্তুতকারকের সিল করা প্যাকেটে থাকে। বেরিয়ার কন্ট্রাসেপ্টিভ গর্ভধারণ ও অনেক সংক্রমণের ঝুঁকি অনেকটা কমায়, তবে কোনো পদ্ধতিই ১০০% কার্যকর নয়। সবসময় প্যাকের নির্দেশনা মেনে চলুন।',
        ],
      },
      {
        title: 'অর্ডার, মূল্য ও ডেলিভারি',
        paragraphs: [
          'মূল্য বাংলাদেশি টাকায় (৳)। স্পষ্ট মূল্য-ভুল আমরা সংশোধন করতে পারি। আপনার এলাকার ডেলিভারি চার্জ কনফার্ম করার আগে চেকআউটে দেখানো হয়। সাধারণত ঢাকায় ১ দিনে এবং সারা দেশে ২–৩ দিনে ডেলিভারি হয়।',
        ],
      },
      {
        title: 'ক্যাশ অন ডেলিভারি ও পেমেন্ট',
        paragraphs: [
          'পার্সেল হাতে পেয়ে নগদে অথবা আগে বিকাশ বা নগদে পেমেন্ট করতে পারেন। ক্যাশ অন ডেলিভারিতে অর্ডার করলে পার্সেল গ্রহণ ও ইনভয়েসের টাকা পরিশোধের জন্য উপস্থিত থাকুন। যথাযথ কারণ ছাড়া বারবার পার্সেল ফেরত দিলে আপনার নম্বর ও ঠিকানা ব্লক করা হতে পারে।',
        ],
      },
      {
        title: 'স্বাস্থ্য বিষয়ক তথ্য',
        paragraphs: [
          'এই সাইটের তথ্য সাধারণ, ডাক্তারের পরামর্শের বিকল্প নয়। পণ্যের নির্দেশনা না মানার কারণে কোনো ক্ষতির দায় আমাদের নয়।',
        ],
      },
      {
        title: 'প্রশ্ন',
        paragraphs: [`হোয়াটসঅ্যাপে ${WHATSAPP} বা ${EMAIL}-এ আমাদের সাথে যোগাযোগ করুন।`],
      },
    ],
  },
  refund: {
    title: 'রিটার্ন ও রিফান্ড পলিসি',
    intro:
      'পাঠানোর আগে প্রতিটি অর্ডার আপনার সাথে কনফার্ম করা হয়। এগুলো ব্যক্তিগত যত্নের পণ্য হওয়ায় রিটার্ন সীমিত এবং আগে আমাদের অনুমোদন লাগবে।',
    sections: [
      {
        title: 'রিটার্নের আগে আমাদের যাচাই প্রয়োজন',
        paragraphs: [
          `আমাদের না জানিয়ে কিছু ফেরত পাঠাবেন না। অর্ডার নম্বর, ফোন নম্বর এবং স্পষ্ট ছবি বা ছোট ভিডিওসহ হোয়াটসঅ্যাপে (${WHATSAPP}) মেসেজ দিন বা ${EMAIL}-এ ইমেইল করুন। আমরা অনুরোধটি দেখে রিটার্ন গ্রহণযোগ্য কিনা জানাব। অনুমোদন ছাড়া ফেরত পাঠানো পার্সেল গ্রহণ বা রিফান্ড করা হবে না।`,
        ],
      },
      {
        title: 'রিটার্ন ডেলিভারি চার্জ',
        paragraphs: ['রিটার্ন অনুমোদিত হলে পণ্য ফেরত পাঠানোর ডেলিভারি চার্জ গ্রাহক বহন করবেন।'],
      },
      {
        title: 'যেসব পণ্য ফেরত নেওয়া যায়',
        bullets: [
          'প্যাক খোলা থাকতে পারে, তবে ভেতরের প্রতিটি প্যাকেট অক্ষত, সিল করা ও অব্যবহৃত থাকতে হবে।',
          'পণ্যটি আসল অবস্থায় থাকতে হবে, কোনো ধরনের ক্ষতি ছাড়া।',
          'ডেলিভারির পর দ্রুত, ২৪ ঘণ্টার মধ্যে রিটার্নের বিষয়ে জানাতে হবে।',
        ],
      },
      {
        title: 'যেসব পণ্য ফেরত নেওয়া যায় না',
        bullets: [
          'যেকোনোভাবে ক্ষতিগ্রস্ত পণ্য।',
          'খোলা, ছেঁড়া, ব্যবহৃত বা সিল ভাঙা প্যাকেট।',
          'ট্রায়াল প্যাক, স্মার্ট প্যাক এবং খুচরা পিস হিসেবে বিক্রিত যেকোনো পণ্য: এগুলোর রিটার্ন নেই।',
          'প্যাক খোলার পর মত পরিবর্তন।',
        ],
      },
      {
        title: 'ভুল পণ্য পাঠালে',
        paragraphs: [
          'অর্ডারের চেয়ে ভিন্ন পণ্য বা পরিমাণ পেলে ২৪ ঘণ্টার মধ্যে ছবি বা ভিডিওসহ আমাদের জানান। যাচাইয়ের পর আমরা সঠিক পণ্যের ব্যবস্থা করব।',
        ],
      },
      {
        title: 'রিফান্ড',
        paragraphs: [
          'রিটার্ন অনুমোদিত হলে এবং পণ্যটি উপরে বর্ণিত অবস্থায় আমাদের কাছে পৌঁছালে ২–৫ কার্যদিবসের মধ্যে আপনার বিকাশ বা নগদে রিফান্ড দেওয়া হবে। রিটার্ন ডেলিভারি চার্জ ফেরতযোগ্য নয়।',
        ],
      },
    ],
  },
}

export const POLICIES = LANG === 'bn' ? POLICIES_BN : POLICIES_EN

export function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label={L('Breadcrumb', 'ব্রেডক্রাম্ব')} className="flex items-center gap-2 text-sm text-muted-foreground">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate('/')
        }}
        className="hover:text-primary"
      >
        {L('Home', 'হোম')}
      </a>
      <span aria-hidden="true">/</span>
      <span className="font-semibold text-foreground" aria-current="page">
        {current}
      </span>
    </nav>
  )
}

/** Static legal page: terms, privacy or refund policy. */
export function PolicyPage({ page }: { page: keyof typeof POLICIES }) {
  const policy = POLICIES[page]
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 lg:pt-8">
      <Breadcrumb current={policy.title} />
      <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">{policy.title}</h1>
      <p className="mt-3 text-muted-foreground">{policy.intro}</p>

      <div className="mt-8 space-y-6">
        {policy.sections.map((section, i) => (
          <section key={section.title} className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="font-display text-xl font-bold">
              {i + 1}. {section.title}
            </h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-muted-foreground">
                {section.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
