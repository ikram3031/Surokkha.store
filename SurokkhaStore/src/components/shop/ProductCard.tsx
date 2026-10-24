import { ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg, catLabel, type Product } from '@/data/products'
import { taka } from '@/lib/bn'
import { useCart } from '@/context/CartContext'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl p-0">
      <div className={`relative flex aspect-square items-center justify-center ${catBg[product.cat]}`}>
        {product.badge && (
          <Badge className="absolute left-3 top-3 bg-card text-primary hover:bg-card">
            {product.badge}
          </Badge>
        )}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-3/5 w-3/5">
            <ProductArtIcon art={product.art} c1={product.c1} c2={product.c2} />
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="hidden text-xs text-muted-foreground sm:block">{catLabel[product.cat]}</p>
        <h3 className="truncate text-sm font-semibold leading-snug sm:mt-1 sm:text-base sm:whitespace-normal">
          {product.name}
        </h3>
        <p className="mt-1 hidden text-sm leading-snug text-muted-foreground sm:block">
          {product.desc}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
          <span className="font-display text-lg font-bold text-primary">{taka(product.price)}</span>
          <Button
            size="icon"
            className="rounded-full"
            onClick={() => add(product)}
            aria-label={`${product.name} কার্টে যোগ করুন`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
