import { useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AgeGate } from '@/components/AgeGate'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { Header } from '@/components/header/Header'
import { HeroSlider } from '@/components/HeroSlider'
import { TrustStrip } from '@/components/TrustStrip'
import { Categories } from '@/components/Categories'
import { Shop } from '@/components/Shop'
import { SafeUse } from '@/components/SafeUse'
import { Faq } from '@/components/Faq'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CartProvider } from '@/context/CartContext'
import type { ShopFilter } from '@/components/shop/FilterBar'

function AppShell() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [cartOpen, setCartOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)

  const selectCategory = (cat: ShopFilter) => {
    setFilter(cat)
    shopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <AgeGate />
      <AnnouncementBar />
      <Header query={query} onQueryChange={setQuery} onCartOpen={() => setCartOpen(true)} />
      <main className="bg-[#eee]">
        <HeroSlider />
        <TrustStrip />
        <Categories onSelect={selectCategory} />
        <Shop ref={shopRef} query={query} filter={filter} onFilterChange={setFilter} />
        <SafeUse />
        <Faq />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <Toaster />
    </>
  )
}

export default function App() {
  return (
    <CartProvider>
      <AppShell />
    </CartProvider>
  )
}
