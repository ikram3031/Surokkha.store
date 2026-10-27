import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bn } from '@/lib/bn'
import { useCart } from '@/context/CartContext'

/** Plain bag icon with a small count badge. */
export function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative size-10 rounded-full text-background hover:bg-background/10 hover:text-background"
      aria-label={`Open cart${count ? `, ${count} items` : ''}`}
    >
      <ShoppingBag className="size-6" strokeWidth={1.6} />
      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ring px-1 text-[11px] font-bold leading-none text-foreground">
        {bn(count)}
      </span>
    </Button>
  )
}
