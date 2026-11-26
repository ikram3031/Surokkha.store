import { pixelTrack, setPixelUserData } from '@/lib/pixel'
import { trackProductEvents } from '@/lib/api/productEvents'
import { getCheckoutSessionId } from '@/lib/api/checkoutLeads'
import { firstTime, noteAction } from './botGuard'

export interface TrackLine {
  id: string
  slug?: string
  name: string
  price: number
  qty: number
}

// Sends AddToCart once per product per page session, counting every click for the bot signals
export const trackAddToCart = (line: TrackLine) => {
  noteAction('cart')
  if (!firstTime(`atc:${line.id}`)) return
  pixelTrack('AddToCart', { value: line.price, currency: 'BDT', content_ids: [line.id], content_name: line.name, content_type: 'product' })
  trackProductEvents([{ eventType: 'add_to_cart', productKey: line.slug || line.id, productName: line.name, quantity: 1, value: line.price }])
}

// Sends InitiateCheckout once per checkout session with the ic_<sessionId> event id the server dedupes on
export const trackInitiateCheckout = (lines: TrackLine[], total: number) => {
  noteAction('checkout')
  if (!firstTime('ic')) return
  pixelTrack('InitiateCheckout', {
    value: total,
    currency: 'BDT',
    content_ids: lines.map((l) => l.id),
    content_type: 'product',
    num_items: lines.reduce((s, l) => s + l.qty, 0),
  }, `ic_${getCheckoutSessionId()}`)
  trackProductEvents(lines.map((l) => ({ eventType: 'checkout', productKey: l.slug || l.id, productName: l.name, quantity: l.qty, value: l.price * l.qty })))
}

// Sends Purchase (or Lead for lead-first orders) once per order number plus the product funnel lines
export const trackOrderPlaced = (orderNumber: string, lines: TrackLine[], total: number, asLead: boolean, customer?: { name?: string; phone?: string; email?: string; district?: string }) => {
  if (!orderNumber || !firstTime(`order:${orderNumber}`)) return
  if (customer) setPixelUserData({ phone: customer.phone, email: customer.email, fullName: customer.name, district: customer.district })
  pixelTrack(asLead ? 'Lead' : 'Purchase', {
    content_ids: lines.map((l) => l.id),
    contents: lines.map((l) => ({ id: l.id, quantity: l.qty, item_price: l.price })),
    content_type: 'product',
    num_items: lines.reduce((s, l) => s + l.qty, 0),
    value: total,
    currency: 'BDT',
  }, orderNumber)
  trackProductEvents(lines.map((l) => ({ eventType: 'purchase', productKey: l.slug || l.id, productName: l.name, quantity: l.qty, value: l.price * l.qty })))
}
