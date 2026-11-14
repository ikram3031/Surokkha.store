import { useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/context/CartContext'
import { categoryPath, navigate, productPath } from '@/lib/router'
import { taka } from '@/lib/bn'
import type { Product } from '@/data/products'
import { L } from '@/lib/i18n'

// The two best combo deals, same picks as surokkha.shop's "Featured Combos" block
const LEFT = { id: '6ab8a664721c81cc89218856', slug: 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo' }
const RIGHT = { id: '6ad3db40d7265af12af6aa8d', slug: 'protection-combo-20-pcs-50gm-gel' }

const live = (p?: Product) => !!p && p.inStock !== false
const isCombo = (p: Product) => !!p.categorySlugs?.includes('combo') || /combo/i.test(`${p.slug} ${p.name}`)

type Theme = { ring: string; text: string; soft: string; badge: string; save: string; cta: string }
const GOLD: Theme = {
  ring: 'border-amber-400/80 hover:border-amber-300',
  text: 'text-amber-400',
  soft: 'border-amber-500/30',
  badge: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300/40',
  save: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950',
  cta: 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-400 hover:to-rose-800 border-rose-400/40',
}
const VIOLET: Theme = {
  ring: 'border-purple-500/80 hover:border-purple-400',
  text: 'text-purple-400',
  soft: 'border-purple-500/30',
  badge: 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white border-purple-400/40',
  save: 'bg-gradient-to-r from-purple-500 to-rose-500 text-white',
  cta: 'bg-gradient-to-r from-purple-600 via-rose-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-purple-400/40',
}

function ComboCard({ product, badge, contents, note, theme }: { product: Product; badge: string; contents: string; note: string; theme: Theme }) {
  const { add } = useCart()
  const price = product.price
  const regular = product.regularPrice && product.regularPrice > price ? product.regularPrice : 0
  const open = () => product.slug && navigate(productPath(product.slug))

  return (
    <div className={`group relative flex flex-col justify-between rounded-3xl border-2 bg-slate-900/90 p-5 text-left shadow-2xl transition-all duration-300 sm:p-6 ${theme.ring}`}>
      <div className={`absolute -top-3.5 right-6 z-20 flex items-center gap-1 rounded-full border px-3.5 py-1 text-[10px] font-black tracking-wider uppercase shadow-xl sm:text-xs ${theme.badge}`}>
        {badge}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={open} className={`h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-slate-950 p-1 sm:h-28 sm:w-28 ${theme.soft}`}>
            {product.image && <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full rounded-xl object-cover" />}
          </button>
          <div className="min-w-0 flex-1">
            <h3 onClick={open} className="line-clamp-2 cursor-pointer text-base font-bold text-white transition hover:opacity-80 sm:text-lg">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">{contents}</p>
          </div>
        </div>

        <div className={`flex items-center justify-between gap-3 rounded-2xl border bg-slate-950/90 p-3.5 ${theme.soft}`}>
          <div>
            <div className={`text-[10px] font-bold tracking-wider uppercase ${theme.text}`}>{L('Special combo price', 'স্পেশাল কম্বো মূল্য')}</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className={`animate-price-shake text-2xl font-black sm:text-3xl ${theme.text}`}>{taka(price)}</span>
              {regular > 0 && <span className="text-xs text-slate-400 line-through sm:text-sm">{taka(regular)}</span>}
            </div>
          </div>
          <div className="text-right">
            {regular > 0 && <span className={`inline-block rounded-xl px-2.5 py-1 text-xs font-black ${theme.save}`}>{L('Save', 'সাশ্রয়')} {taka(regular - price)}</span>}
            <div className="mt-1 text-[10px] font-bold text-emerald-400">{note}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-4">
        <button
          type="button"
          onClick={() => {
            add(product)
            navigate('/checkout')
          }}
          className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold text-white shadow-lg transition active:scale-95 sm:text-sm ${theme.cta}`}
        >
          ⚡ {L('Order now', 'অর্ডার করুন')}
        </button>
        <button
          type="button"
          onClick={() => add(product)}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 sm:text-sm"
        >
          🛒 {L('Add to cart', 'কার্টে যোগ করুন')}
        </button>
      </div>
    </div>
  )
}

/** "Featured combos": the two best combo deals on a dark spotlight panel (English port of surokkha.shop's block). */
export function ComboOffers() {
  const { products } = useProducts()
  const [left, right] = useMemo(() => {
    const find = (k: { id: string; slug: string }) => products.find((p) => p.apiId === k.id || p.slug === k.slug)
    const combos = products.filter((p) => live(p) && isCombo(p))
    const l = live(find(LEFT)) ? find(LEFT)! : combos[0]
    const r = live(find(RIGHT)) && find(RIGHT) !== l ? find(RIGHT)! : combos.find((c) => c !== l)
    return [l, r]
  }, [products])

  if (!left && !right) return null

  return (
    <section id="combo-offers" className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-600/40 bg-[#0b0a0e] p-6 text-white shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-rose-600/15 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-500/60 bg-rose-950/90 px-3.5 py-1.5 text-xs font-bold text-amber-300">
                <span className="animate-pulse">🔥</span>
                <span>{L('Mega savings • Exclusive combo packs', 'মেগা সেভিংস • এক্সক্লুসিভ কম্বো প্যাক')}</span>
              </div>
              <h2 className="text-2xl leading-tight font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
                {L('Featured combos —', 'ফিচার্ড কম্বো —')} <span className="text-amber-400">{L('premium value bundles', 'প্রিমিয়াম ভ্যালু বান্ডেল')}</span>
              </h2>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">{L('More in one pack, guaranteed savings, delivered in one discreet parcel.', 'এক প্যাকে বেশি পণ্য, নিশ্চিত সাশ্রয়, একটি গোপনীয় পার্সেলে ডেলিভারি।')}</p>
            </div>
            <a
              href={categoryPath('combo')}
              onClick={(e) => {
                e.preventDefault()
                navigate(categoryPath('combo'))
              }}
              className="flex items-center gap-1 text-xs font-bold text-amber-300 underline underline-offset-4 hover:text-amber-200 sm:text-sm"
            >
              {L('View all combos →', 'সব কম্বো দেখুন →')}
            </a>
          </div>

          <div className="grid grid-cols-1 gap-5 pt-1 sm:gap-6 md:grid-cols-2">
            {left && (
              <ComboCard
                product={left}
                theme={GOLD}
                badge={`⭐ ${L('Most popular deal', 'সবচেয়ে জনপ্রিয় ডিল')} (${taka(left.price)})`}
                contents={left.slug === LEFT.slug || left.apiId === LEFT.id ? L('1x Ultra Thin + 1x Dotted + 1x Ribbed = 3 full sealed boxes.', '১টি আল্ট্রা থিন + ১টি ডটেড + ১টি রিবড = ৩টি সম্পূর্ণ সিল করা বক্স।') : left.desc}
                note={left.slug === LEFT.slug || left.apiId === LEFT.id ? `${L('Only', 'মাত্র')} ${taka(Math.round(left.price / 30))} / ${L('piece', 'পিস')}` : L('Combo deal', 'কম্বো ডিল')}
              />
            )}
            {right && (
              <ComboCard
                product={right}
                theme={VIOLET}
                badge={right.slug === RIGHT.slug || right.apiId === RIGHT.id ? L('🔥 Protection combo • 20 pcs + care', '🔥 প্রোটেকশন কম্বো • ২০ পিস + কেয়ার') : L('🔥 Limited combo deal', '🔥 সীমিত কম্বো ডিল')}
                contents={right.slug === RIGHT.slug || right.apiId === RIGHT.id ? L('Two full 10-piece boxes plus a 50g personal care pack.', '১০ পিসের ২টি সম্পূর্ণ বক্স এবং ৫০ গ্রামের একটি পার্সোনাল কেয়ার প্যাক।') : right.desc}
                note={right.slug === RIGHT.slug || right.apiId === RIGHT.id ? L('20 pcs + 50g', '২০ পিস + ৫০ গ্রাম') : L('Combo deal', 'কম্বো ডিল')}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
