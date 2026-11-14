import { useState } from 'react'
import { User } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { CartButton } from '@/components/header/CartButton'
import { MobileNav } from '@/components/header/MobileNav'
import { navigate, useRoute } from '@/lib/router'
import { L } from '@/lib/i18n'

/**
 * Header v2 (dark): logo + menu (Home, Shop, Offers, Contact) logo left, menu centred, profile then cart on the right (no search).
 * The previous dark header stays in Header.tsx; App.tsx picks which one is shown.
 */
export function Header2({
  onCartOpen,
  onCategory,
}: {
  query: string
  onQueryChange: (value: string) => void
  onCartOpen: () => void
  onCategory: (slug: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const route = useRoute()

  const links: { label: string; path?: string; active: boolean; onClick?: () => void }[] = [
    { label: L('Home', 'হোম'), path: '/', active: route.name === 'home' },
    { label: L('Shop', 'শপ'), path: '/shop', active: route.name === 'shop' || route.name === 'category' },
    { label: L('Offers', 'অফার'), path: '/offer-products', active: route.name === 'offer-products' },
    {
      label: L('Contact', 'যোগাযোগ'),
      active: false,
      // Footer (with the contact details) is on every page
      onClick: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }),
    },
  ]

  return (
    <header className="dark sticky top-0 z-40 border-b border-white/10 bg-header text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-8">
        {/* Mobile: menu button */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="-ml-1 rounded-lg p-2 hover:bg-white/10 md:hidden"
              aria-label={L('Open menu', 'মেনু খুলুন')}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="max-w-xs border-none bg-header text-white [&_svg]:text-white">
            <SheetTitle className="sr-only">{L('Menu', 'মেনু')}</SheetTitle>
            <MobileNav onNavigate={() => setMenuOpen(false)} onCategory={onCategory} />
          </SheetContent>
        </Sheet>

        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
          className="shrink-0"
          aria-label={L('Surokkha home', 'সুরক্ষা হোম')}
        >
          <img src="/surokkha_store_logo_dark.png" alt={L('Surokkha Store', 'সুরক্ষা স্টোর')} className="h-9 w-auto" />
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-8 text-[15px] font-medium md:flex" aria-label={L('Main menu', 'প্রধান মেনু')}>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.path ?? '#contact'}
              onClick={(e) => {
                e.preventDefault()
                if (l.onClick) l.onClick()
                else if (l.path) navigate(l.path)
              }}
              className={`transition-colors hover:text-primary ${l.active ? 'font-semibold text-primary' : ''}`}
              aria-current={l.active ? 'page' : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label={L('My account', 'আমার অ্যাকাউন্ট')}
          >
            <User className="size-6" strokeWidth={1.8} />
          </button>
          <CartButton onClick={onCartOpen} />
        </div>
      </div>
    </header>
  )
}
