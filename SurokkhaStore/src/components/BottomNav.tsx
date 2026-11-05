import { Headset, Home, ShoppingBag, Sparkles } from 'lucide-react'
import { navigate, useRoute } from '@/lib/router'
import { useCart } from '@/context/CartContext'

/**
 * Sticky bottom navigation for mobile only (hidden from md up, where the
 * header already carries the full nav). No account entry here by design —
 * the account link lives in the side menu.
 */
export function BottomNav({ onCartOpen }: { onCartOpen: () => void }) {
  const route = useRoute()
  const { count } = useCart()

  const itemBase = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors'
  const on = 'text-background'
  const off = 'text-background/60 hover:text-background'

  const isHome = route.name === 'home' || route.name === 'home-classic'
  const isOffer = route.name === 'offer' || route.name === 'group-offer'

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-background/15 bg-foreground text-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <button type="button" onClick={() => navigate('/')} className={`${itemBase} ${isHome ? on : off}`}>
          <Home className="h-5 w-5" />
          Home
        </button>
        <button type="button" onClick={() => navigate('/offer')} className={`${itemBase} ${isOffer ? on : off}`}>
          <Sparkles className="h-5 w-5" />
          Offers
        </button>
        <button type="button" onClick={onCartOpen} className={`${itemBase} ${off}`}>
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold text-foreground">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          className={`${itemBase} ${off}`}
        >
          <Headset className="h-5 w-5" />
          Contact
        </button>
      </div>
    </nav>
  )
}
