import { Home, ShoppingBag, Sparkles } from 'lucide-react'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { navigate, useRoute } from '@/lib/router'
import { useCart } from '@/context/CartContext'

const WHATSAPP_URL = 'https://wa.me/8801600905774'

/**
 * Sticky bottom navigation for mobile only (hidden from md up, where the
 * header already carries the full nav). No account entry here by design —
 * the account link lives in the side menu.
 */
export function BottomNav({ onCartOpen }: { onCartOpen: () => void }) {
  const route = useRoute()
  const { count } = useCart()

  const itemBase = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors'
  const on = 'text-white'
  const off = 'text-white/60 hover:text-white'

  const isHome = route.name === 'home' || route.name === 'home-classic'
  const isOffer = route.name === 'offers' || route.name === 'offer' || route.name === 'group-offer'

  return (
    <nav
      aria-label="Quick navigation"
      className="dark fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-background text-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <button type="button" onClick={() => navigate('/')} className={`${itemBase} ${isHome ? on : off}`}>
          <Home className="h-5 w-5 text-nav-accent" />
          Home
        </button>
        <button type="button" onClick={() => navigate('/offers')} className={`${itemBase} ${isOffer ? on : off}`}>
          <Sparkles className="h-5 w-5 text-nav-accent" />
          Offers
        </button>
        <button type="button" onClick={onCartOpen} className={`${itemBase} ${off}`}>
          <span className="relative">
            <ShoppingBag className="h-5 w-5 text-nav-accent" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-background px-1 text-[10px] font-bold text-foreground">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${itemBase} ${off}`}>
          <WhatsAppIcon className="h-5 w-5" />
          Contact
        </a>
      </div>
    </nav>
  )
}
