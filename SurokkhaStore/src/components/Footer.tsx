import { Separator } from '@/components/ui/separator'
import { navigate } from '@/lib/router'
import { L } from '@/lib/i18n'
import { STORE_WHATSAPP_URL } from '@/lib/siteConfig'

const QUICK_LINKS = [
  { label: L('Privacy Policy', 'প্রাইভেসি পলিসি'), path: '/privacy-policy' },
  { label: L('Terms & Conditions', 'শর্তাবলী'), path: '/terms-and-conditions' },
  { label: L('Return & Refund Policy', 'রিটার্ন ও রিফান্ড পলিসি'), path: '/return-and-refund-policy' },
  { label: L('FAQ', 'সাধারণ জিজ্ঞাসা'), path: '/faq' },
]

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/surokkha.shop2',
    icon: 'M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/surokkha_store/',
    icon: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.2 5.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM21.9 8c-.1-1.6-.4-3-1.6-4.2C19.1 2.6 17.6 2.2 16 2.1 14.4 2 9.6 2 8 2.1c-1.6.1-3 .4-4.2 1.6C2.6 4.9 2.2 6.4 2.1 8 2 9.6 2 14.4 2.1 16c.1 1.6.4 3 1.6 4.2 1.2 1.2 2.6 1.6 4.2 1.6 1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.6 1.2-1.2 1.6-2.6 1.6-4.2.1-1.6.1-6.4.2-8zm-2.1 9.7a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4a3.3 3.3 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.7s-.1-4.4.4-5.7A3.3 3.3 0 0 1 6.6 4.5c1.3-.5 4.3-.4 5.7-.4s4.4-.1 5.7.4a3.3 3.3 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.7z',
  },
  {
    label: 'Email',
    href: 'mailto:surokkha.store@gmail.com',
    icon: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.2-8 5-8-5V6l8 5 8-5v2.2z',
  },
]

export function Footer() {
  return (
    <footer className="dark hidden bg-header text-white md:block">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <img src="/surokkha_store_logo_dark.png" alt={L('Surokkha Store', 'সুরক্ষা স্টোর')} className="h-10 w-auto" />
          <p className="mt-3 text-sm text-white/70">{L('Safe today, tomorrow too.', 'আজও নিরাপদ, আগামীকালও।')}</p>
          <div className="mt-4 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-primary hover:bg-primary hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d={icon} /></svg>
              </a>
            ))}
          </div>
        </div>
        <div id="contact" className="scroll-mt-24 text-sm">
          <h3 className="font-semibold text-white">{L('Contact', 'যোগাযোগ')}</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            <li>
              {L('WhatsApp:', 'হোয়াটসঅ্যাপ:')}{' '}
              <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white underline-offset-4 hover:underline">
                {L('Message us on WhatsApp', 'WhatsApp-এ মেসেজ দিন')}
              </a>
            </li>
            <li>
              {L('Email:', 'ইমেইল:')}{' '}
              <a href="mailto:surokkha.store@gmail.com" className="hover:text-white">
                surokkha.store@gmail.com
              </a>
            </li>
            <li>{L('Every day, 10 AM to 10 PM', 'প্রতিদিন সকাল ১০টা থেকে রাত ১০টা')}</li>
            <li>
              <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog') }} className="hover:text-white">
                {L('Health & safety blog', 'স্বাস্থ্য ও সুরক্ষা ব্লগ')}
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white">{L('Quick Links', 'গুরুত্বপূর্ণ লিংক')}</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            {QUICK_LINKS.map((link) => (
              <li key={link.path}>
                <a
                  href={link.path}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(link.path)
                  }}
                  className="hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-white"
              >
                {L('Contact', 'যোগাযোগ')}
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white">{L('Payment', 'পেমেন্ট')}</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            <li>{L('bKash', 'বিকাশ')}</li>
            <li>{L('Nagad', 'নগদ')}</li>
            <li>{L('Cash on delivery', 'ক্যাশ অন ডেলিভারি')}</li>
          </ul>
        </div>
      </div>
      <Separator className="bg-white/15" />
      <div className="space-y-1 px-4 py-5 text-center text-xs text-white/60">
        <p>{L('© Surokkha Store. All rights reserved.', '© সুরক্ষা স্টোর। সর্বস্বত্ব সংরক্ষিত।')}</p>
        <p>
          {L('© 2026 Surokkha Store. Developed by', '© ২০২৬ সুরক্ষা স্টোর। ডেভেলপ করেছে')}{' '}
          <a
            href="https://plexivia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-white/80 hover:text-white hover:underline"
          >
            Plexivia
          </a>
        </p>
      </div>
    </footer>
  )
}
