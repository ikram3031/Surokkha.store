import { useEffect, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { Header } from '@/components/header/Header'
import { Header2 } from '@/components/header/Header2'
import { ShopPage } from '@/components/shop/ShopPage'
import { OfferProductsPage } from '@/components/offer/OfferProductsPage'
import { HomeClassic } from '@/components/home/HomeClassic'
import { CategoryPage } from '@/components/category/CategoryPage'
import { SearchResults } from '@/components/shop/SearchResults'
import { FaqPage } from '@/components/pages/FaqPage'
import { PolicyPage } from '@/components/pages/PolicyPage'
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { OfferHome } from '@/components/OfferHome'
import { GroupOfferPage } from '@/components/offer/GroupOfferPage'
import { OffersPage } from '@/components/offer/OffersPage'
import { ProductPage } from '@/components/product/ProductPage'
import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { ConfirmationPage } from '@/components/checkout/ConfirmationPage'
import { CartProvider } from '@/context/CartContext'
import { AccountPage } from '@/components/account/AccountPage'
import { BlogArchive } from '@/components/blog/BlogArchive'
import { BlogPost } from '@/components/blog/BlogPost'
import { NotFoundPage } from '@/components/pages/NotFoundPage'
import { categoryPath, navigate, useRoute, type Route } from '@/lib/router'
import { pixelTrack } from '@/lib/pixel'
import { staticRouteTitle } from '@/lib/pageTitle'
import { trackPageView } from '@/lib/api/productEvents'
import type { ShopFilter } from '@/components/shop/FilterBar'

// Ads launch mode: the whole storefront is the single offer page (the /offer page),
// with no header, footer, announcement bar or home page. The catalog, Meta pixel and cart storage all keep
// working. Set to false to bring the full home page, header and footer back.
const OFFER_ONLY_MODE = false

// "All Products" grid is hidden on the home page for now; flip to true to bring it back
const SHOW_ALL_PRODUCTS = false

// Light header v2 (logo + menu left, search / cart / profile right). false brings back the old dark Header.
const USE_HEADER_V2 = true

function AppShell() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ShopFilter>('all')
  const [cartOpen, setCartOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)
  const urlRoute = useRoute()
  // In offer-only mode the site root (and the old home URLs) show the offer page
  const route: Route =
    OFFER_ONLY_MODE && (urlRoute.name === 'home' || urlRoute.name === 'home-classic') ? { name: 'offer' } : urlRoute
  // The offer page is a standalone ad landing page: no announcement bar, header, footer or bottom nav
  // (it has its own sticky order bar and cart), so it can run its own campaigns
  const bare = route.name === 'offer'
  // While something is typed in the header search, results replace the page (except during checkout)
  const searching = query.trim().length > 0 && route.name !== 'checkout' && route.name !== 'confirmation'
  const routeKey =
    route.name === 'product' || route.name === 'category' || route.name === 'group-offer' || route.name === 'blog-post' ? `${route.name}:${route.slug}` : route.name === 'policy' ? `policy:${route.page}` : route.name

  // Every page gets its own title (product, category, blog and 404 pages set theirs from their own data)
  useEffect(() => {
    const title = staticRouteTitle(route)
    if (title) document.title = title
  }, [routeKey])

  // Meta gets one PageView per visit (on entry); every page change is counted only in our own Pages report
  const metaPageViewSent = useRef(false)
  useEffect(() => {
    if (!metaPageViewSent.current) {
      metaPageViewSent.current = true
      pixelTrack('PageView')
    }
    trackPageView(route.name)
    // Opening any page (a product from the results, a category...) ends the search
    setQuery('')
  }, [routeKey])

  // Tells search engines the one URL for this page: the main domain, without query strings
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = `https://surokkhastore.shop${window.location.pathname}`
  }, [routeKey])

  // Menu and category tiles open that category's own page
  const selectCategory = (cat: ShopFilter) => {
    setFilter(cat)
    navigate(cat === 'all' ? '/' : categoryPath(cat))
  }

  return (
    <>
      {!bare && <AnnouncementBar />}
      {!bare && USE_HEADER_V2 && <Header2 query={query} onQueryChange={setQuery} onCartOpen={() => setCartOpen(true)} onCategory={selectCategory} />}
      {!bare && !USE_HEADER_V2 && <Header query={query} onQueryChange={setQuery} onCartOpen={() => setCartOpen(true)} onCategory={selectCategory} />}
      <main className="min-h-[90vh]">
        {searching && <SearchResults query={query} onClear={() => setQuery('')} />}
        {!searching && (
          <>
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
        {route.name === 'home' && <ShopPage />}
        {route.name === 'offer' && <OfferHome />}
        {route.name === 'offers' && <OffersPage />}
        {route.name === 'shop' && <ShopPage />}
        {route.name === 'offer-products' && <OfferProductsPage />}
        {route.name === 'group-offer' && <GroupOfferPage slug={route.slug} />}
        {route.name === 'category' && <CategoryPage slug={route.slug} />}
        {route.name === 'product' && <ProductPage slug={route.slug} />}
        {route.name === 'checkout' && <CheckoutPage />}
        {route.name === 'confirmation' && <ConfirmationPage />}
        {route.name === 'account' && <AccountPage />}
        {route.name === 'faq' && <FaqPage />}
        {route.name === 'policy' && <PolicyPage page={route.page} />}
        {route.name === 'blog' && <BlogArchive />}
        {route.name === 'blog-post' && <BlogPost slug={route.slug} />}
        {route.name === 'not-found' && <NotFoundPage />}
          </>
        )}
      </main>
      {!bare && <Footer />}
      {/* Clearance so the sticky mobile bottom nav never covers footer content */}
      {!bare && route.name !== 'checkout' && <div className="h-16 md:hidden" aria-hidden />}
      {!bare && route.name !== 'checkout' && <FloatingWhatsApp />}
      {!bare && route.name !== 'checkout' && <BottomNav onCartOpen={() => setCartOpen(true)} />}
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
