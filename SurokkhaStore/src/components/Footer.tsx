import { Separator } from '@/components/ui/separator'
import { navigate } from '@/lib/router'
import { L } from '@/lib/i18n'

const QUICK_LINKS = [
  { label: L('Privacy Policy', 'প্রাইভেসি পলিসি'), path: '/privacy-policy' },
  { label: L('Terms & Conditions', 'শর্তাবলী'), path: '/terms-and-conditions' },
  { label: L('Return & Refund Policy', 'রিটার্ন ও রিফান্ড পলিসি'), path: '/return-and-refund-policy' },
  { label: L('FAQ', 'সাধারণ জিজ্ঞাসা'), path: '/faq' },
]

export function Footer() {
  return (
    <footer className="dark bg-header text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <img src="/surokkha_store_logo_dark.png" alt={L('Surokkha Store', 'সুরক্ষা স্টোর')} className="h-10 w-auto" />
          <p className="mt-3 text-sm text-white/70">{L('Safe today, tomorrow too.', 'আজও নিরাপদ, আগামীকালও।')}</p>
        </div>
        <div id="contact" className="scroll-mt-24 text-sm">
          <h3 className="font-semibold text-white">{L('Contact', 'যোগাযোগ')}</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            <li>
              {L('WhatsApp:', 'হোয়াটসঅ্যাপ:')}{' '}
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                +880 1600-905774
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
        <p>{L('Products on this site are for adults aged 18 and over only. © Surokkha. All rights reserved.', 'এই সাইটের পণ্য শুধুমাত্র ১৮ বছর বা তার বেশি বয়সী প্রাপ্তবয়স্কদের জন্য। © সুরক্ষা। সর্বস্বত্ব সংরক্ষিত।')}</p>
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
