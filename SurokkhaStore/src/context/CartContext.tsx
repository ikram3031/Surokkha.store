import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { FREE_SHIP_AT, SHIP_FEE, type Product } from '@/data/products'
import { groupOfferTotals, hasFreeDelivery } from '@/lib/checkout'
import type { GroupOfferProduct, GroupOfferRule } from '@/lib/api/groupOffers'
import { newEventId, trackAddToCart } from '@/lib/api/events'
import { productKeyOf, trackProductEvents } from '@/lib/api/productEvents'
import { pixelTrack } from '@/lib/pixel'
import { L } from '@/lib/i18n'

interface CartLine {
  product: Product
  qty: number
}

type CartState = Record<number, CartLine>

interface CartContextValue {
  cart: CartState
  count: number
  subtotal: number
  shipping: number
  total: number
  freeShipNote: string
  /** Discount from Group Offers in the cart */
  groupDiscount: number
  add: (product: Product, qty?: number) => void
  /** Replaces this Group Offer's lines in the cart with the picked pieces */
  addGroup: (rule: GroupOfferRule, picks: { product: GroupOfferProduct; qty: number }[]) => void
  inc: (id: number) => void
  dec: (id: number) => void
  remove: (id: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({})

  const add = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev[product.id]
      return { ...prev, [product.id]: { product, qty: (existing?.qty ?? 0) + qty } }
    })
    toast.success(L('Added to cart', 'কার্টে যোগ করা হয়েছে'))
    const contentId = product.did ?? product.slug ?? String(product.id)
    const eventId = newEventId('atc')
    trackAddToCart({ productDid: contentId, productName: product.apiName ?? product.name, price: product.price, qty, eventId })
    trackProductEvents([{ eventType: 'add_to_cart', productKey: productKeyOf(product), productName: product.apiName ?? product.name, quantity: qty, value: product.price * qty }])
    pixelTrack('AddToCart', {
      content_ids: [contentId],
      content_name: product.apiName ?? product.name,
      content_type: 'product',
      value: product.price * qty,
      currency: 'BDT',
    }, eventId)
  }
  const addGroup = (rule: GroupOfferRule, picks: { product: GroupOfferProduct; qty: number }[]) => {
    setCart((prev) => {
      const next: CartState = {}
      for (const [id, line] of Object.entries(prev)) if (line.product.groupOffer?.id !== rule.id) next[Number(id)] = line
      for (const { product: p, qty } of picks) {
        if (qty <= 0) continue
        // Group lines get their own cart id so the same product can also be bought outside the group
        let hash = 0
        for (const ch of `${rule.id}:${p.id}`) hash = (hash * 31 + ch.charCodeAt(0)) | 0
        const id = -(Math.abs(hash) + 1)
        next[id] = {
          qty,
          product: {
            id,
            cat: 'condom',
            name: p.name,
            desc: rule.name,
            price: p.unitPrice,
            art: 'box',
            slug: p.slug,
            apiName: p.name,
            apiId: p.id,
            itemType: 'product',
            did: p.did,
            image: p.image || undefined,
            inStock: p.inStock,
            groupOffer: rule,
          },
        }
      }
      return next
    })
    toast.success(`${rule.name} added to cart`)
    // Dashboard analytics: one add-to-cart per combo, however many products were picked
    const picked = picks.filter((x) => x.qty > 0)
    trackProductEvents([{
      eventType: 'add_to_cart',
      productKey: `combo:${rule.slug}`,
      productName: rule.name,
      quantity: 1,
      value: picked.reduce((s, x) => s + x.product.unitPrice * x.qty, 0),
    }])
    pixelTrack('AddToCart', {
      content_ids: picks.filter((x) => x.qty > 0).map((x) => x.product.did),
      content_name: rule.name,
      content_type: 'product',
      value: picks.reduce((s, x) => s + x.product.unitPrice * x.qty, 0),
      currency: 'BDT',
    })
  }
  const clear = () => setCart({})
  const inc = (id: number) =>
    setCart((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      return { ...prev, [id]: { ...existing, qty: existing.qty + 1 } }
    })
  const dec = (id: number) =>
    setCart((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      const qty = existing.qty - 1
      const next = { ...prev }
      // Group Offer pieces never drop below the offer's minimum: going under it removes the product
      if (qty <= 0 || (existing.product.groupOffer && qty < existing.product.groupOffer.minPerProduct)) delete next[id]
      else next[id] = { ...existing, qty }
      return next
    })
  const remove = (id: number) =>
    setCart((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

  const { count, subtotal, shipping, total, freeShipNote, groupDiscount } = useMemo(() => {
    const lines = Object.values(cart)
    const count = lines.reduce((s, line) => s + line.qty, 0)
    const subtotal = lines.reduce((s, line) => s + line.qty * line.product.price, 0)
    // Free delivery: a product's own offer, or any order of ৳1,000 or more
    const freeDelivery = hasFreeDelivery(lines) || subtotal >= FREE_SHIP_AT
    const shipping = subtotal === 0 || freeDelivery ? 0 : SHIP_FEE
    const freeShipNote =
      subtotal > 0 && freeDelivery ? L('Delivery is free on your order.', 'আপনার অর্ডারে ডেলিভারি ফ্রি।') : ''
    const groupDiscount = groupOfferTotals(lines).discount
    return { count, subtotal, shipping, total: subtotal + shipping - groupDiscount, freeShipNote, groupDiscount }
  }, [cart])

  const value: CartContextValue = {
    cart,
    count,
    subtotal,
    shipping,
    total,
    freeShipNote,
    groupDiscount,
    add,
    addGroup,
    inc,
    dec,
    remove,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
