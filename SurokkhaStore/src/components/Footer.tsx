import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <img src="/logo_2.png" alt="Surokkha" className="h-10 w-auto" />
          <p className="mt-3 text-sm text-background/70">Safe today, tomorrow too.</p>
        </div>
        <div id="contact" className="scroll-mt-24 text-sm">
          <h3 className="font-semibold text-background">Contact</h3>
          <ul className="mt-3 space-y-2 text-background/70">
            <li>
              WhatsApp:{' '}
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:text-background">
                +880 1600-905774
              </a>
            </li>
            <li>
              Email:{' '}
              <a href="mailto:surokkha.store@gmail.com" className="hover:text-background">
                surokkha.store@gmail.com
              </a>
            </li>
            <li>Every day, 10 AM to 10 PM</li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-background">Payment</h3>
          <ul className="mt-3 space-y-2 text-background/70">
            <li>bKash</li>
            <li>Nagad</li>
            <li>Cash on delivery</li>
          </ul>
        </div>
      </div>
      <Separator className="bg-background/15" />
      <div className="space-y-1 px-4 py-5 text-center text-xs text-background/60">
        <p>Products on this site are for adults aged 18 and over only. &copy; Surokkha. All rights reserved.</p>
        <p>
          &copy; 2026 Surokkha Store. Developed by{' '}
          <a
            href="https://plexivia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-background/80 hover:text-background hover:underline"
          >
            Plexivia
          </a>
        </p>
      </div>
    </footer>
  )
}
