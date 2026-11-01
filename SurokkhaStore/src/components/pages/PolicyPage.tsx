import { navigate } from '@/lib/router'

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

export const POLICIES: Record<'terms' | 'privacy' | 'refund', Policy> = {
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
    intro: 'For hygiene reasons opened or used products cannot be returned, but we will always put right a problem that is on our side.',
    sections: [
      {
        title: 'When you can get a replacement or refund',
        bullets: [
          'The pack was damaged in transit.',
          'You received a different product or quantity from what you ordered.',
          'The factory seal was already broken when it arrived.',
        ],
      },
      {
        title: 'Tell us within 24 hours',
        paragraphs: [
          `Please check your parcel when it arrives. If something is wrong, message us on WhatsApp (${WHATSAPP}) within 24 hours of delivery with your order phone number and a clear photo or short video of the problem.`,
        ],
      },
      {
        title: 'What happens next',
        bullets: [
          'Replacement: we send the correct item at no extra delivery cost.',
          'Refund: if a replacement is not possible, we refund the amount to your bKash or Nagad within 2–5 working days.',
        ],
      },
      {
        title: 'What we cannot take back',
        bullets: ['Packs that have been opened or used.', 'Change of mind after the factory seal has been broken.'],
      },
    ],
  },
}

export function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate('/')
        }}
        className="hover:text-primary"
      >
        Home
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
