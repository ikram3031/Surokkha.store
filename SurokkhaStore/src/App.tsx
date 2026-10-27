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
import { ProductPage } from '@/components/product/ProductPage'
import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { ConfirmationPage } from '@/components/checkout/ConfirmationPage'
import { CartProvider } from '@/context/CartContext'
import { useRoute } from '@/lib/router'
import type { ShopFilter } from '@/components/shop/FilterBar'

function AppShell() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [cartOpen, setCartOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)
  const route = useRoute()

  const selectCategory = (cat: ShopFilter) => {
    setFilter(cat)
    shopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <AgeGate />
      <AnnouncementBar />
      <Header query={query} onQueryChange={setQuery} onCartOpen={() => setCartOpen(true)} />
      <main className="bg-[#f4f4f5]">
        {route.name === 'home' && (
          <>
            <HeroSlider />
            <TrustStrip />
            <Categories onSelect={selectCategory} />
            <Shop ref={shopRef} query={query} filter={filter} onFilterChange={setFilter} />
            <SafeUse />
            <Faq />
          </>
        )}
        {route.name === 'product' && <ProductPage slug={route.slug} />}
        {route.name === 'checkout' && <CheckoutPage />}
        {route.name === 'confirmation' && <ConfirmationPage />}
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
