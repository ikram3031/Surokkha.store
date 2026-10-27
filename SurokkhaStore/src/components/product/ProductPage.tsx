import { useEffect, useState } from 'react'
import { Minus, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductArtIcon } from '@/components/icons/ArtIcons'
import { catBg, catLabel, type Product } from '@/data/products'
import { useCart } from '@/context/CartContext'
import { getProduct } from '@/lib/api/products'
import { trackViewContent } from '@/lib/api/events'
import { mapApiProduct, type ApiProduct } from '@/lib/api/mappers'
import { bn, taka } from '@/lib/bn'
import { navigate } from '@/lib/router'
import { pixelTrack } from '@/lib/pixel'

/** The API wraps single resources as `{ status, data }`; unwrap defensively. */
function unwrapOne(res: unknown): ApiProduct | null {
  if (res && typeof res === 'object' && 'data' in res) return (res as { data: ApiProduct }).data
  return (res as ApiProduct) ?? null
}

export function ProductPage({ slug }: { slug: string }) {
  const { add } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setQty(1)
    setActiveImage(0)
    getProduct<unknown>(slug)
      .then((res) => {
        const raw = unwrapOne(res)
        if (!raw) throw new Error('not found')
        const mapped = mapApiProduct(raw)
        if (cancelled) return
        setProduct(mapped)
        trackViewContent({ productId: mapped.apiId ?? mapped.id })
        pixelTrack('ViewContent', {
          content_ids: [mapped.did ?? mapped.slug ?? String(mapped.id)],
          content_name: mapped.apiName ?? mapped.name,
          content_type: 'product',
          value: mapped.price,
          currency: 'BDT',
        })
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (failed || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-lg font-semibold">পণ্যটি পাওয়া যায়নি।</p>
        <Button className="mt-4 rounded-full" onClick={() => navigate('/')}>
          সব পণ্য দেখুন
        </Button>
      </div>
    )
  }

  const images = [product.image, ...(product.gallery ?? [])].filter(
    (src, i, all): src is string => !!src && all.indexOf(src) === i,
  )
  const soldOut = product.inStock === false
  const hasDiscount = !!product.regularPrice && product.regularPrice > product.price

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 md:gap-12 md:py-12">
      <div>
        <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-border ${catBg[product.cat]}`}>
          {images.length > 0 ? (
            <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-3/5 w-3/5">
              <ProductArtIcon art={product.art} c1={product.c1} c2={product.c2} />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`ছবি ${bn(i + 1)}`}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === activeImage ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-muted-foreground">{catLabel[product.cat]}</p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-snug md:text-3xl">{product.name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold text-primary">{taka(product.price)}</span>
          {hasDiscount && (
            <span className="text-lg text-muted-foreground line-through">{taka(product.regularPrice!)}</span>
          )}
        </div>

        {product.desc && <p className="mt-4 leading-relaxed text-muted-foreground">{product.desc}</p>}

        <div className="mt-6 flex items-center gap-4">
          <div className="inline-flex items-center rounded-full border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="কমান"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{bn(qty)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              aria-label="বাড়ান"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">মোট {taka(product.price * qty)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-12 flex-1 rounded-full text-base"
            disabled={soldOut}
            onClick={() => {
              add(product, qty)
              navigate('/checkout')
            }}
          >
            {soldOut ? 'স্টকে নেই' : 'এখনই অর্ডার করুন'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 flex-1 rounded-full text-base"
            disabled={soldOut}
            onClick={() => add(product, qty)}
          >
            <ShoppingCart className="h-4 w-4" />
            কার্টে যোগ করুন
          </Button>
        </div>

        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />১০০% গোপন প্যাকেজিং, কোনো ব্র্যান্ডিং ছাড়াই
          </li>
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন
          </li>
        </ul>

        {product.longDescription && (
          <div
            className="prose-sm mt-8 border-t border-border pt-6 leading-relaxed text-muted-foreground [&_p]:mb-3 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
            // Admin-authored HTML from our own StoreWeb API
            dangerouslySetInnerHTML={{ __html: product.longDescription }}
          />
        )}
      </div>
    </div>
  )
}
