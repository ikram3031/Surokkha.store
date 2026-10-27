import type { ProductArt } from '@/components/icons/ArtIcons'

export type ProductCategory = 'condom' | 'lube' | 'combo'

export interface Product {
  id: number
  cat: ProductCategory
  name: string
  desc: string
  price: number
  art: ProductArt
  c1?: string
  c2?: string
  badge?: string
  image?: string
  /** Set for products loaded from the API; needed for the product page and order payload. */
  slug?: string
  /** API's canonical (English) name — sent on orders, as SurokkhaShop does. */
  apiName?: string
  apiId?: string
  did?: string
  gallery?: string[]
  longDescription?: string
  regularPrice?: number
  inStock?: boolean
}

export const products: Product[] = [
  { id: 1, cat: 'condom', name: 'সুরক্ষা ক্লাসিক', desc: '৩ পিস, মসৃণ ল্যাটেক্স', price: 90, art: 'box', c1: '#F4919F', c2: '#C9475F', badge: 'বেস্ট সেলার' },
  { id: 2, cat: 'condom', name: 'আল্ট্রা থিন', desc: '১০ পিস, অতিপাতলা', price: 320, art: 'box', c1: '#F5E6D3', c2: '#948B86' },
  { id: 3, cat: 'condom', name: 'ডটেড ও রিবড', desc: '১২ পিস, টেক্সচারড', price: 420, art: 'box', c1: '#C9475F', c2: '#3A322F' },
  { id: 4, cat: 'condom', name: 'ফ্রুটি ফ্লেভার', desc: '৩ পিস, স্ট্রবেরি ফ্লেভার', price: 120, art: 'box', c1: '#F7B3BE', c2: '#F4919F', badge: 'নতুন' },
  { id: 5, cat: 'lube', name: 'ওয়াটার-বেসড লুব', desc: '১০০ মি.লি., সহজে ধুয়ে যায়', price: 350, art: 'bottle', c1: '#F5E6D3', c2: '#948B86', badge: 'বেস্ট সেলার' },
  { id: 6, cat: 'lube', name: 'সিলিকন-বেসড লুব', desc: '৫০ মি.লি., দীর্ঘস্থায়ী', price: 480, art: 'bottle', c1: '#F4919F', c2: '#C9475F' },
  { id: 7, cat: 'lube', name: 'সেনসিটিভ স্কিন লুব', desc: '৭৫ মি.লি., সুগন্ধিমুক্ত', price: 390, art: 'bottle', c1: '#FBD6DB', c2: '#C9475F' },
  { id: 8, cat: 'combo', name: 'স্টার্টার কম্বো', desc: 'ক্লাসিক ৩ পিস + ওয়াটার-বেসড লুব ৫০ মি.লি.', price: 390, art: 'combo', badge: 'সাশ্রয়ী' },
]

export const catLabel: Record<ProductCategory, string> = {
  condom: 'কনডম',
  lube: 'লুব্রিকেন্ট',
  combo: 'কম্বো প্যাক',
}

// Soft tint behind each product's art, grouped by category.
// These are decorative/product-grouping colors tied to brand hues,
// kept as theme tokens (muted/accent/secondary) so they still follow the theme.
export const catBg: Record<ProductCategory, string> = {
  condom: 'bg-secondary',
  lube: 'bg-accent',
  combo: 'bg-muted',
}

export const FREE_SHIP_AT = 1000
export const SHIP_FEE = 60
