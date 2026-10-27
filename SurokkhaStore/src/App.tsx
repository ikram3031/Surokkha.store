import { useEffect, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AgeGate } from '@/components/AgeGate'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { Header } from '@/components/header/Header'
import { HeroSlider } from '@/components/HeroSlider'
import { TrustStrip } from '@/components/TrustStrip'
import { FeaturedCarousel } from '@/components/FeaturedCarousel'
import { Categories } from '@/components/Categories'
import { OnSaleSection } from '@/components/OnSaleSection'
import { Shop } from '@/components/Shop'
import { SafeUse } from '@/components/SafeUse'
import { Faq } from '@/components/Faq'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { OfferHome } from '@/components/OfferHome'
import { ProductPage } from '@/components/product/ProductPage'
import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { ConfirmationPage } from '@/components/checkout/ConfirmationPage'
import { CartProvider } from '@/context/CartContext'
import { AccountPage } from '@/components/account/AccountPage'
import { navigate, useRoute } from '@/lib/router'
import { pixelTrack } from '@/lib/pixel'
import type { ShopFilter } from '@/components/shop/FilterBar'

// "সব পণ্য" grid is hidden on the home page for now; flip to true to bring it back
const SHOW_ALL_PRODUCTS = false

function AppShell() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [cartOpen, setCartOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)
  const route = useRoute()
  const routeKey = route.name === 'product' ? `product:${route.slug}` : route.name

  // One PageView per page (the SPA never reloads between routes)
  useEffect(() => {
    pixelTrack('PageView')
  }, [routeKey])

  const selectCategory = (cat: ShopFilter) => {
    setFilter(cat)
    if (route.name !== 'home') navigate('/')
    // Wait for the menu sheet to finish closing (it locks scroll) and, from other pages, for the shop to mount
    setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), route.name === 'home' ? 350 : 500)
  }

  return (
    <>
      <AgeGate />
      <AnnouncementBar />
      <Header query={query} onQueryChange={setQuery} onCartOpen={() => setCartOpen(true)} onCategory={selectCategory} />
      <main className="min-h-[90vh]">
        {route.name === 'home' && (
          <>
            <HeroSlider />
            <TrustStrip />
            <FeaturedCarousel />
            <Categories onSelect={selectCategory} />
            <OnSaleSection />
            {SHOW_ALL_PRODUCTS && <Shop ref={shopRef} query={query} filter={filter} onFilterChange={setFilter} />}
            <SafeUse />
            <Faq />
          </>
        )}
        {route.name === 'offer' && <OfferHome />}
        {route.name === 'product' && <ProductPage slug={route.slug} />}
        {route.name === 'checkout' && <CheckoutPage />}
        {route.name === 'confirmation' && <ConfirmationPage />}
        {route.name === 'account' && <AccountPage />}
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
