import type { RefObject } from 'react'
import { HeroSlider } from '@/components/HeroSlider'
import { TrustStripClassic } from '@/components/home/TrustStripClassic'
import { FeaturedCarousel } from '@/components/FeaturedCarousel'
import { Categories } from '@/components/Categories'
import { OnSaleSection } from '@/components/OnSaleSection'
import { Shop } from '@/components/Shop'
import { SafeUse } from '@/components/SafeUse'
import { Faq } from '@/components/Faq'
import type { ShopFilter } from '@/components/shop/FilterBar'

// Backup of the original home page (slider hero first). Reachable at /home-classic while the new home is being designed.
export function HomeClassic({
  shopRef,
  query,
  filter,
  onFilterChange,
  onSelectCategory,
  showAllProducts = false,
}: {
  shopRef: RefObject<HTMLDivElement | null>
  query: string
  filter: ShopFilter
  onFilterChange: (filter: ShopFilter) => void
  onSelectCategory: (cat: ShopFilter) => void
  showAllProducts?: boolean
}) {
  return (
    <>
      <HeroSlider />
      <TrustStripClassic />
      <FeaturedCarousel />
      <Categories onSelect={onSelectCategory} />
      <OnSaleSection />
      {showAllProducts && <Shop ref={shopRef} query={query} filter={filter} onFilterChange={onFilterChange} />}
      <SafeUse />
      <Faq />
    </>
  )
}
