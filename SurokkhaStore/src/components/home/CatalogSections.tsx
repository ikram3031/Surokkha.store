import { useMemo } from 'react'
import { ProductCarousel } from '@/components/home/ProductCarousel'
import { ProductCard } from '@/components/shop/ProductCard'
import { SectionHeading } from '@/components/SectionHeading'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/data/products'
import { L } from '@/lib/i18n'

const inStock = (p: Product) => p.inStock !== false
// The MO Smart Pack sits in the "combo" category but belongs with the MO packs, shown last
const isSmartPack = (p: Product) => !!p.slug?.includes('smart-pack')
const isCombo = (p: Product) => !!p.categorySlugs?.includes('combo') && !isSmartPack(p)
// MO is Surokkha\'s own brand: single packs are in the "contraceptive" category (other brands' condoms are in
// "condoms") or have an "mo-" slug. Combos are shown in their own section.
const isMo = (p: Product) =>
  !isCombo(p) &&
  (!!p.slug?.startsWith('mo-') || (!!p.categorySlugs?.includes('contraceptive') && !p.categorySlugs?.includes('condoms')))

function useCatalogGroups() {
  const { products } = useProducts()
  return useMemo(() => {
    const live = products.filter(inStock)
    const combos = live.filter(isCombo)
    // Every MO pack is listed, including ones that are temporarily out of stock (the card says so)
    const mo = [...products.filter((p) => isMo(p) && !isSmartPack(p)), ...products.filter(isSmartPack)]
    const rest = live.filter((p) => !isCombo(p) && !isMo(p))
    return { combos, mo, rest }
  }, [products])
}

const MO_GRID_COUNT = 12

/** MO packs as a plain grid (no carousel): 12 cards, 4 per row on desktop, 2 per row on mobile.
 *  If there are fewer than 12 MO packs, other in-stock products fill the grid. */
export function MoProducts() {
  const { mo, combos, rest } = useCatalogGroups()
  const seen = new Set<string>()
  const items = [...mo, ...combos, ...rest]
    .filter((p) => {
      const key = p.slug ?? String(p.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MO_GRID_COUNT)
  if (items.length === 0) return null
  return (
    <section id="mo-products" className="mx-auto max-w-7xl px-4 py-8 md:py-10" aria-label={L('MO products', 'MO প্রোডাক্টস')}>
      <SectionHeading title={L('MO products', 'MO প্রোডাক্টস')} subtitle={L("Surokkha's own latex contraceptives", 'সুরক্ষার নিজস্ব ল্যাটেক্স কন্ট্রাসেপ্টিভ')} />
      <div className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

/** Combo packs, in a tinted band. */
export function ComboProducts() {
  const { combos } = useCatalogGroups()
  if (combos.length === 0) return null
  return (
    <div className="bg-wine">
      <ProductCarousel id="combo-packs" title={L('Combo packs', 'কম্বো প্যাক')} subtitle={L('Buy more, save more', 'বেশি কিনুন, বেশি সাশ্রয় করুন')} products={combos} />
    </div>
  )
}

/** Everything that is neither MO nor a combo: other wellness, lubricants, care. */
export function WellnessProducts() {
  const { rest } = useCatalogGroups()
  return <ProductCarousel id="wellness" title={L('More wellness products', 'আরও ওয়েলনেস প্রোডাক্টস')} subtitle={L('Trusted brands for everyday intimate care', 'প্রতিদিনের ব্যক্তিগত যত্নে বিশ্বস্ত ব্র্যান্ড')} products={rest} />
}
