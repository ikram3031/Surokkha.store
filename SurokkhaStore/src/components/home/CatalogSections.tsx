import { useMemo } from 'react'
import { ProductCarousel } from '@/components/home/ProductCarousel'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/data/products'

const inStock = (p: Product) => p.inStock !== false
// The MO Smart Pack sits in the "combo" category but belongs with the MO packs, shown last
const isSmartPack = (p: Product) => !!p.slug?.includes('smart-pack')
const isCombo = (p: Product) => !!p.categorySlugs?.includes('combo') && !isSmartPack(p)
// MO is Surokkha's own brand: single packs are in the "contraceptive" category (other brands' condoms are in
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

/** Every single-pack MO product. */
export function MoProducts() {
  const { mo } = useCatalogGroups()
  return <ProductCarousel id="mo-products" title="MO products" subtitle="Surokkha's own latex contraceptives" products={mo} />
}

/** Combo packs, in a tinted band. */
export function ComboProducts() {
  const { combos } = useCatalogGroups()
  if (combos.length === 0) return null
  return (
    <div className="bg-wine">
      <ProductCarousel id="combo-packs" title="Combo packs" subtitle="Buy more, save more" products={combos} />
    </div>
  )
}

/** Everything that is neither MO nor a combo: other wellness, lubricants, care. */
export function WellnessProducts() {
  const { rest } = useCatalogGroups()
  return <ProductCarousel id="wellness" title="More wellness products" subtitle="Trusted brands for everyday intimate care" products={rest} />
}
