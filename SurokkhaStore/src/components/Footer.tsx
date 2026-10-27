import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <img src="/logo_2.png" alt="সুরক্ষা" className="h-10 w-auto" />
          <p className="mt-3 text-sm text-background/70">আজ নিরাপদ, আগামীকালও।</p>
        </div>
        <div id="contact" className="scroll-mt-24 text-sm">
          <h3 className="font-semibold text-background">যোগাযোগ</h3>
          <ul className="mt-3 space-y-2 text-background/70">
            <li>
              হোয়াটসঅ্যাপ:{' '}
              <a href="https://wa.me/8801600905774" target="_blank" rel="noopener noreferrer" className="hover:text-background">
                +৮৮০ ১৬০০-৯০৫৭৭৪
              </a>
            </li>
            <li>
              ইমেইল:{' '}
              <a href="mailto:surokkha.store@gmail.com" className="hover:text-background">
                surokkha.store@gmail.com
              </a>
            </li>
            <li>সকাল ১০টা থেকে রাত ১০টা, প্রতিদিন</li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-background">পেমেন্ট</h3>
          <ul className="mt-3 space-y-2 text-background/70">
            <li>বিকাশ</li>
            <li>নগদ</li>
            <li>ক্যাশ অন ডেলিভারি</li>
          </ul>
        </div>
      </div>
      <Separator className="bg-background/15" />
      <div className="space-y-1 px-4 py-5 text-center text-xs text-background/60">
        <p>এই সাইটের পণ্য শুধুমাত্র ১৮ বছর বা তার বেশি বয়সীদের জন্য। &copy; সুরক্ষা। সর্বস্বত্ব সংরক্ষিত।</p>
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
