import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg, type Product } from '@/data/products'
import { bn, taka } from '@/lib/bn'
import { useCart } from '@/context/CartContext'

export function CartItem({ product, qty }: { product: Product; qty: number }) {
  const { inc, dec, remove } = useCart()

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3">
      <div className={`h-16 w-16 shrink-0 rounded-xl p-2 ${catBg[product.cat]}`}>
        <ProductArtIcon art={product.art} c1={product.c1} c2={product.c2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{product.name}</p>
        <p className="text-sm text-muted-foreground">{taka(product.price)}</p>
        <div className="mt-1 inline-flex items-center rounded-full border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => dec(product.id)}
            aria-label="কমান"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-6 text-center text-sm font-semibold">{bn(qty)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => inc(product.id)}
            aria-label="বাড়ান"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{taka(product.price * qty)}</p>
        <button
          className="mt-1 text-xs text-primary underline"
          onClick={() => remove(product.id)}
        >
          মুছুন
        </button>
      </div>
    </div>
  )
}
