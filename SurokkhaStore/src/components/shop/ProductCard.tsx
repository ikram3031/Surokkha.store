import { Eye, ShoppingCart, Zap } from 'lucide-react'
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
  const soldOut = product.inStock === false
  const onSale = !!product.regularPrice && product.regularPrice > product.price
  const discountPercent = onSale ? Math.round((1 - product.price / product.regularPrice!) * 100) : 0

  return (
    <Card
      className={`group h-full gap-0 overflow-hidden p-0 ${product.slug ? 'cursor-pointer' : ''}`}
      onClick={product.slug ? () => navigate(productPath(product.slug!)) : undefined}
    >
      <div className={`relative flex aspect-square items-center justify-center ${catBg[product.cat]}`}>
        {product.badge && (
          <Badge className="absolute left-3 top-3 bg-card text-primary hover:bg-card">
            {product.badge}
          </Badge>
        )}
        {soldOut && (
          <Badge className="absolute bottom-3 left-3 z-10 bg-background text-white hover:bg-background">Out of stock</Badge>
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
        {/* Hover overlay with a white view icon */}
        {product.slug && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span className="flex h-12 w-12 translate-y-2 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition-transform duration-300 group-hover:translate-y-0">
              <Eye className="h-5 w-5" />
            </span>
          </div>
        )}
      </div>
      {/* Fixed-height title block + mt-auto footer keeps every card the same height, whatever the name length */}
      <CardContent className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-xs text-muted-foreground">{catLabel[product.cat]}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.75em] text-base font-semibold leading-snug sm:text-lg" title={product.name}>
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="flex min-w-0 items-baseline gap-x-2">
            <span className="font-display text-lg font-bold text-price">{taka(product.price)}</span>
            {onSale && <s className="truncate text-sm text-muted-foreground">{taka(product.regularPrice!)}</s>}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="size-9 shrink-0 rounded-full"
            disabled={soldOut}
            onClick={(e) => {
              e.stopPropagation()
              add(product)
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
        {/* Straight to checkout with just this product */}
        <Button
          className="mt-2 h-9 w-full text-sm font-semibold"
          disabled={soldOut}
          onClick={(e) => {
            e.stopPropagation()
            add(product)
            navigate('/checkout')
          }}
        >
          {soldOut ? 'Out of stock' : (<><Zap className="h-4 w-4" />Order now</>)}
        </Button>
      </CardContent>
    </Card>
  )
}
