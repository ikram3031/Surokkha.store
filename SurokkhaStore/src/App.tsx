import { useEffect, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AgeGate } from '@/components/AgeGate'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { Header } from '@/components/header/Header'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeClassic } from '@/components/home/HomeClassic'
import { IntroProducts } from '@/components/home/IntroProducts'
import { CareTabs } from '@/components/home/CareTabs'
import { ShopByNeed } from '@/components/home/ShopByNeed'
import { CategoryPage } from '@/components/category/CategoryPage'
import { PopularProducts } from '@/components/home/PopularProducts'
import { LearnCards } from '@/components/home/LearnCards'
import { Testimonial } from '@/components/home/Testimonial'
import { FaqSection } from '@/components/home/FaqSection'
import { Newsletter } from '@/components/home/Newsletter'
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp'
import { DeliverySteps } from '@/components/home/DeliverySteps'
import { TrustStrip } from '@/components/TrustStrip'
import { FeaturedCarousel } from '@/components/FeaturedCarousel'
import { Shop } from '@/components/Shop'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { OfferHome } from '@/components/OfferHome'
import { GroupOfferPage } from '@/components/offer/GroupOfferPage'
import { ProductPage } from '@/components/product/ProductPage'
import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { ConfirmationPage } from '@/components/checkout/ConfirmationPage'
import { CartProvider } from '@/context/CartContext'
import { AccountPage } from '@/components/account/AccountPage'
import { BlogArchive } from '@/components/blog/BlogArchive'
import { BlogPost } from '@/components/blog/BlogPost'
import { categoryPath, navigate, useRoute, type Route } from '@/lib/router'
import { pixelTrack } from '@/lib/pixel'
import type { ShopFilter } from '@/components/shop/FilterBar'

// Ads launch mode: the whole storefront is the single offer page (same UI as offer.surokkha.shop),
// with no header, footer, announcement bar or home page. The catalog, Meta pixel and cart storage all keep
// working. Set to false to bring the full home page, header and footer back.
const OFFER_ONLY_MODE = true

// "All Products" grid is hidden on the home page for now; flip to true to bring it back
const SHOW_ALL_PRODUCTS = false

function AppShell() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [cartOpen, setCartOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)
  const urlRoute = useRoute()
  // In offer-only mode the site root (and the old home URLs) show the offer page
  const route: Route =
    OFFER_ONLY_MODE && (urlRoute.name === 'home' || urlRoute.name === 'home-classic') ? { name: 'offer' } : urlRoute
  const bare = OFFER_ONLY_MODE && route.name === 'offer'
  const routeKey =
    route.name === 'product' || route.name === 'category' || route.name === 'group-offer' || route.name === 'blog-post' ? `${route.name}:${route.slug}` : route.name

  // One PageView per page (the SPA never reloads between routes)
  useEffect(() => {
    pixelTrack('PageView')
  }, [routeKey])

  // Menu and category tiles open that category's own page
  const selectCategory = (cat: ShopFilter) => {
    setFilter(cat)
    navigate(cat === 'all' ? '/' : categoryPath(cat))
  }

  return (
    <>
      <AgeGate />
      {!bare && <AnnouncementBar />}
      {!bare && <Header query={query} onQueryChange={setQuery} onCartOpen={() => setCartOpen(true)} onCategory={selectCategory} />}
      <main className="min-h-[90vh]">
        {route.name === 'home-classic' && (
          <HomeClassic
            shopRef={shopRef}
            query={query}
            filter={filter}
            onFilterChange={setFilter}
            onSelectCategory={selectCategory}
            showAllProducts={SHOW_ALL_PRODUCTS}
          />
        )}
        {route.name === 'home' && (
          <>
            <HomeHero />
            <TrustStrip />
            <IntroProducts />
            <CareTabs />
            <DeliverySteps />
            <ShopByNeed />
            <FeaturedCarousel />
            <PopularProducts />
            {SHOW_ALL_PRODUCTS && <Shop ref={shopRef} query={query} filter={filter} onFilterChange={setFilter} />}
            <LearnCards />
            <Testimonial />
            <FaqSection />
            <Newsletter />
          </>
        )}
        {route.name === 'offer' && <OfferHome />}
        {route.name === 'group-offer' && <GroupOfferPage slug={route.slug} />}
        {route.name === 'category' && <CategoryPage slug={route.slug} />}
        {route.name === 'product' && <ProductPage slug={route.slug} />}
        {route.name === 'checkout' && <CheckoutPage />}
        {route.name === 'confirmation' && <ConfirmationPage />}
        {route.name === 'account' && <AccountPage />}
        {route.name === 'blog' && <BlogArchive />}
        {route.name === 'blog-post' && <BlogPost slug={route.slug} />}
      </main>
      {!bare && <Footer />}
      {!bare && route.name !== 'checkout' && <FloatingWhatsApp />}
      {!bare && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}
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
