// StoreWeb API client — grouped by the resource sections in the API reference.
// Base URL comes from VITE_API_BASE_URL (see .env.development / .env.production).
export * from '@/lib/api/client'
export * from '@/lib/api/types'
export * as productsApi from '@/lib/api/products'
export * as itemsApi from '@/lib/api/items'
export * as searchApi from '@/lib/api/search'
export * as authApi from '@/lib/api/auth'
export * as ordersApi from '@/lib/api/orders'
export * as paymentsApi from '@/lib/api/payments'
export * as catalogApi from '@/lib/api/catalog' // categories, brands, coupons
export * as reviewsApi from '@/lib/api/reviews'
export * as storeConfigApi from '@/lib/api/store-config' // size charts, store utils
export * as mediaApi from '@/lib/api/media' // assets, images
export * as contactApi from '@/lib/api/contact' // contact, subscribers
export * as eventsApi from '@/lib/api/events' // pixel events
export * as locationsApi from '@/lib/api/locations'
export * as miscApi from '@/lib/api/misc'
