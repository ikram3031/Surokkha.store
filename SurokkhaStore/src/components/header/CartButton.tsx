import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bn } from '@/lib/bn'
import { useCart } from '@/context/CartContext'

export function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart()

  return (
    <Button
      onClick={onClick}
      className="relative flex items-center gap-2 rounded-full"
      aria-label="কার্ট খুলুন"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden sm:inline">কার্ট</span>
      <span className="min-w-[1.5rem] rounded-full bg-primary-foreground px-1.5 text-center text-sm font-bold text-primary">
        {bn(count)}
      </span>
    </Button>
  )
}
