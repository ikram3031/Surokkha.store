import type { Product } from '@/data/products'
import { ProductCard } from '@/components/shop/ProductCard'

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="mt-10 text-center text-muted-foreground">
        এই নামে কোনো পণ্য পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।
      </p>
    )
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
