import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bn } from '@/lib/bn'
import { useCart } from '@/context/CartContext'
import { L } from '@/lib/i18n'

/** Cart icon with a small count badge. */
export function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative size-10 rounded-full text-white hover:bg-white/10 hover:text-white"
      aria-label={`${L('Open cart', 'কার্ট খুলুন')}${count ? `, ${bn(count)} ${L('items', 'আইটেম')}` : ''}`}
    >
      <ShoppingCart className="size-6" strokeWidth={1.8} />
      {count > 0 && (<span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ring px-1 text-[11px] font-bold leading-none text-foreground">
        {bn(count)}
      </span>)}
    </Button>
  )
}
