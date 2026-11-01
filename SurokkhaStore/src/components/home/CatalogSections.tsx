import { useMemo } from 'react'
import { ProductCarousel } from '@/components/home/ProductCarousel'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/data/products'

const inStock = (p: Product) => p.inStock !== false
const isCombo = (p: Product) => !!p.categorySlugs?.includes('combo')
// MO is Surokkha's own brand: its slugs start with "mo-" (combos are shown in their own section)
const isMo = (p: Product) => !!p.slug?.startsWith('mo-') && !isCombo(p)

function useCatalogGroups() {
  const { products } = useProducts()
  return useMemo(() => {
    const live = products.filter(inStock)
    const combos = live.filter(isCombo)
    const mo = live.filter(isMo)
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
    <div className="bg-accent/40">
      <ProductCarousel id="combo-packs" title="Combo packs" subtitle="Buy more, save more" products={combos} />
    </div>
  )
}

/** Everything that is neither MO nor a combo: other wellness, lubricants, care. */
export function WellnessProducts() {
  const { rest } = useCatalogGroups()
  return <ProductCarousel id="wellness" title="More wellness products" subtitle="Trusted brands for everyday intimate care" products={rest} />
}
