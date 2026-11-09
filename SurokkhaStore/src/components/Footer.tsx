import { Separator } from '@/components/ui/separator'
import { navigate } from '@/lib/router'

const QUICK_LINKS = [
  { label: 'Privacy Policy', path: '/privacy-policy' },
  { label: 'Terms & Conditions', path: '/terms-and-conditions' },
  { label: 'Return & Refund Policy', path: '/return-and-refund-policy' },
  { label: 'FAQ', path: '/faq' },
]

export function Footer() {
  return (
    <footer className="dark bg-background text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <img src="/surokkha_store_logo_dark.png" alt="Surokkha Store" className="h-10 w-auto" />
          <p className="mt-3 text-sm text-white/70">Safe today, tomorrow too.</p>
        </div>
        <div id="contact" className="scroll-mt-24 text-sm">
          <h3 className="font-semibold text-white">Contact</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            <li>
              WhatsApp:{' '}
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                +880 1600-905774
              </a>
            </li>
            <li>
              Email:{' '}
              <a href="mailto:surokkha.store@gmail.com" className="hover:text-white">
                surokkha.store@gmail.com
              </a>
            </li>
            <li>Every day, 10 AM to 10 PM</li>
            <li>
              <a href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog') }} className="hover:text-white">
                Health &amp; safety blog
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white">Quick Links</h3>
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
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white">Payment</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            <li>bKash</li>
            <li>Nagad</li>
            <li>Cash on delivery</li>
          </ul>
        </div>
      </div>
      <Separator className="bg-white/15" />
      <div className="space-y-1 px-4 py-5 text-center text-xs text-white/60">
        <p>Products on this site are for adults aged 18 and over only. &copy; Surokkha. All rights reserved.</p>
        <p>
          &copy; 2026 Surokkha Store. Developed by{' '}
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
