import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { FREE_SHIP_AT, SHIP_FEE, type Product } from '@/data/products'
import { taka } from '@/lib/bn'
import { trackAddToCart } from '@/lib/api/events'

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
  add: (product: Product, qty?: number) => void
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
    toast('কার্টে যোগ হয়েছে')
    trackAddToCart({ productId: product.apiId ?? product.id, qty, price: product.price })
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
      if (qty <= 0) delete next[id]
      else next[id] = { ...existing, qty }
      return next
    })
  const remove = (id: number) =>
    setCart((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

  const { count, subtotal, shipping, total, freeShipNote } = useMemo(() => {
    const lines = Object.values(cart)
    const count = lines.reduce((s, line) => s + line.qty, 0)
    const subtotal = lines.reduce((s, line) => s + line.qty * line.product.price, 0)
    const shipping = subtotal === 0 || subtotal >= FREE_SHIP_AT ? 0 : SHIP_FEE
    const freeShipNote =
      subtotal === 0
        ? ''
        : subtotal >= FREE_SHIP_AT
          ? 'আপনার অর্ডারে ডেলিভারি ফ্রি।'
          : `আরও ${taka(FREE_SHIP_AT - subtotal)} কিনলে ডেলিভারি ফ্রি।`
    return { count, subtotal, shipping, total: subtotal + shipping, freeShipNote }
  }, [cart])

  const value: CartContextValue = {
    cart,
    count,
    subtotal,
    shipping,
    total,
    freeShipNote,
    add,
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
