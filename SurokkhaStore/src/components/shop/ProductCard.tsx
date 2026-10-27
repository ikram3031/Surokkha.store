import { Eye, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg, catLabel, type Product } from '@/data/products'
import { bn, taka } from '@/lib/bn'
import { useCart } from '@/context/CartContext'
import { navigate, productPath } from '@/lib/router'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  const onSale = !!product.regularPrice && product.regularPrice > product.price
  const discountPercent = onSale ? Math.round((1 - product.price / product.regularPrice!) * 100) : 0

  return (
    <Card
      className={`group gap-0 overflow-hidden rounded-3xl p-0 ${product.slug ? 'cursor-pointer' : ''}`}
      onClick={product.slug ? () => navigate(productPath(product.slug!)) : undefined}
    >
      <div className={`relative flex aspect-square items-center justify-center ${catBg[product.cat]}`}>
        {product.badge && (
          <Badge className="absolute left-3 top-3 bg-card text-primary hover:bg-card">
            {product.badge}
          </Badge>
        )}
        {discountPercent > 0 && (
          <Badge className="absolute right-3 top-3 z-10 bg-primary text-primary-foreground hover:bg-primary">
            -{bn(discountPercent)}%
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
        {/* হোভারে ওভারলে + সাদা ভিউ আইকন */}
        {product.slug && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span className="flex h-12 w-12 translate-y-2 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition-transform duration-300 group-hover:translate-y-0">
              <Eye className="h-5 w-5" />
            </span>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="hidden text-xs text-muted-foreground sm:block">{catLabel[product.cat]}</p>
        <h3 className="truncate text-sm font-semibold leading-snug sm:mt-1 sm:text-base sm:whitespace-normal">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-lg font-bold text-primary">{taka(product.price)}</span>
            {onSale && <s className="text-sm text-muted-foreground">{taka(product.regularPrice!)}</s>}
          </span>
          <Button
            size="icon"
            className="rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              add(product)
            }}
            aria-label={`${product.name} কার্টে যোগ করুন`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
