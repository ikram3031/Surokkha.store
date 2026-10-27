import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bn } from '@/lib/bn'
import { useCart } from '@/context/CartContext'

export function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart()

  return (
    <Button
      onClick={onClick}
      className="relative flex items-center gap-2 rounded-full bg-background text-foreground hover:bg-background/90"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="min-w-[1.5rem] rounded-full bg-primary px-1.5 text-center text-sm font-bold text-primary-foreground">
        {bn(count)}
      </span>
    </Button>
  )
}
