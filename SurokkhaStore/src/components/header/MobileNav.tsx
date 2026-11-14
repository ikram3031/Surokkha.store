import { useEffect, useState } from 'react'
import { ChevronDown, User } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { SESSION_EVENT, getCustomerToken } from '@/lib/api/customer-auth'
import { navigate } from '@/lib/router'
import { L } from '@/lib/i18n'
import { NavOfferCards } from './NavOfferCards'

const itemClass = 'block w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5'

// Same layout as the SurokkhaShop drawer: Home, Shop (collapsible categories), Offers, FAQ, Contact, Blog;
// offer cards and Login / Register pinned to the bottom.
export function MobileNav({
  onNavigate,
  onCategory,
}: {
  /** Closes the sheet after any navigation. */
  onNavigate: () => void
  onCategory: (slug: string) => void
}) {
  const categories = useCategories()
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getCustomerToken()))

  useEffect(() => {
    const refresh = () => setIsLoggedIn(Boolean(getCustomerToken()))
    window.addEventListener(SESSION_EVENT, refresh)
    return () => window.removeEventListener(SESSION_EVENT, refresh)
  }, [])

  const go = (path: string) => {
    onNavigate()
    navigate(path)
  }
  const goCategory = (slug: string) => {
    onNavigate()
    onCategory(slug)
  }

  return (
    <nav className="dark flex h-full flex-col bg-background text-foreground" aria-label={L('Mobile menu', 'মোবাইল মেনু')}>
      {/* Logo — the sheet's own close (X) button sits on the right */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4 pr-14">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            go('/')
          }}
          aria-label={L('Surokkha home', 'সুরক্ষা হোম')}
        >
          <img src="/surokkha_store_logo_dark.png" alt={L('Surokkha Store', 'সুরক্ষা স্টোর')} className="h-9 w-auto" />
        </a>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 text-base">
        <button type="button" className={itemClass} onClick={() => go('/')}>
          {L('Home', 'হোম')}
        </button>

        {/* Closed by default: tapping the label opens the shop, the arrow opens/closes the categories */}
        <details className="group rounded-lg [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg font-semibold text-primary hover:bg-white/5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                go('/shop')
              }}
              className="flex-1 px-3 py-3 text-left"
            >
              {L('Shop', 'শপ')}
            </button>
            <span className="px-3 py-3" aria-label={L('Show categories', 'ক্যাটাগরি দেখুন')}>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="pb-2 pl-3">
            <button type="button" className={itemClass} onClick={() => go('/shop')}>
              {L('All Products', 'সব প্রোডাক্ট')}
            </button>
            {categories.map((c) => (
              <button key={c.slug} type="button" className={itemClass} onClick={() => goCategory(c.slug)}>
                {c.label}
              </button>
            ))}
          </div>
        </details>

        <button type="button" className={itemClass} onClick={() => go('/offer-products')}>
          {L('Offers', 'অফার')}
        </button>
        <button type="button" className={itemClass} onClick={() => go('/faq')}>
          {L('FAQ', 'প্রশ্নোত্তর')}
        </button>
        <button
          type="button"
          className={itemClass}
          onClick={() => {
            onNavigate()
            // Footer (with the contact details) is on every page
            setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 150)
          }}
        >
          {L('Contact', 'যোগাযোগ')}
        </button>
        <button type="button" className={itemClass} onClick={() => go('/blog')}>
          {L('Blog', 'ব্লগ')}
        </button>
      </div>

      {/* Pinned to the bottom */}
      <div className="space-y-3 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NavOfferCards compact onNavigate={onNavigate} />
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => go('/account')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <User className="h-5 w-5 !text-primary-foreground" />
            {L('My Account', 'আমার অ্যাকাউন্ট')}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => go('/account?view=login')}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/30 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <User className="h-5 w-5" />
              {L('Login', 'লগইন')}
            </button>
            <button
              type="button"
              onClick={() => go('/account?view=signup')}
              className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {L('Register', 'রেজিস্টার')}
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
