import { navigate } from '@/lib/router'
import { L, toBnDigits } from '@/lib/i18n'
import { useProducts } from '@/hooks/useProducts'

const FALLBACK_MEGA_COMBO_SLUG = 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'

// Two promotional offer cards shown in the navigation drawer/menu.
export const NavOfferCards = ({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) => {
  const { products } = useProducts()

  const combo30 = products.find((p) => {
    const t = `${p.slug || ''} ${p.name || ''}`.toLowerCase()
    return t.includes('30') && (t.includes('combo') || t.includes('3-in-1'))
  })
  const mo10Packs = products.filter((p) => {
    const t = `${p.slug || ''} ${p.name || ''}`.toLowerCase()
    return t.includes('mo') && /\b10\b/.test(t) && !t.includes('combo') && !t.includes('30')
  })
  const threePackSum = mo10Packs.length >= 3 ? mo10Packs.slice(0, 3).reduce((s, p) => s + Number(p.regularPrice || p.price || 0), 0) : 0

  const megaPrice = combo30?.price || 950
  const megaOld = Math.max(threePackSum, combo30?.regularPrice || 0) || 1350
  const megaSave = Math.max(0, megaOld - megaPrice)
  const megaPct = megaOld > megaPrice ? Math.round((megaSave / megaOld) * 100) : 0
  const megaSlug = combo30?.slug || FALLBACK_MEGA_COMBO_SLUG

  const smartPack = products.find((p) => {
    const t = `${p.slug || ''} ${p.name || ''}`.toLowerCase()
    return t.includes('smart-pack') || (t.includes('18') && t.includes('3-in-1'))
  })
  const smartPrice = smartPack?.price || 720

  const openPath = (path: string) => {
    if (onNavigate) onNavigate()
    navigate(path)
  }

  return (
    <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-4'}`}>
      <button
        type="button"
        onClick={() => openPath(`/product/${megaSlug}`)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-rose-600 to-[#4a0d24] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        {megaPct > 0 && (
          <span className={`rounded-full bg-amber-400 font-extrabold text-black ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
            🔥 {L(`${megaPct}% OFF`, `${toBnDigits(megaPct)}% ছাড়`)}
          </span>
        )}
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {L('30 pcs Mega Combo', '৩০ পিস মেগা কম্বো')}
        </span>
        <span className={`mt-1 flex items-baseline gap-1.5 ${compact ? '' : 'mt-2'}`}>
          <span className={`font-black ${compact ? 'text-lg' : 'text-3xl'}`}>৳{L(String(megaPrice), toBnDigits(megaPrice))}</span>
          {megaOld > megaPrice && (
            <span className={`line-through decoration-red-500 text-white/80 ${compact ? 'text-xs' : 'text-base'}`}>৳{L(String(megaOld), toBnDigits(megaOld))}</span>
          )}
        </span>
        {megaSave > 0 && (
          <span className={`mt-1 font-bold text-amber-300 ${compact ? 'text-[11px]' : 'text-sm'}`}>
            {L(`Save ৳${megaSave}`, `৳${toBnDigits(megaSave)} সাশ্রয়`)}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => openPath(smartPack?.slug ? `/product/${smartPack.slug}` : '/special-offer')}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-emerald-600 to-[#064e3b] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        <span className={`rounded-full bg-white font-extrabold text-emerald-800 ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          🚚 {L('Free Delivery', 'ফ্রি ডেলিভারি')}
        </span>
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {L('3-in-1 Smart Pack', 'থ্রি ইন ওয়ান স্মার্ট প্যাক')}
        </span>
        <span className={`mt-1 font-black ${compact ? 'text-lg' : 'text-3xl mt-2'}`}>
          ৳{L(String(smartPrice), toBnDigits(smartPrice))}
        </span>
        <span className={`mt-1 font-bold text-emerald-100 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {L('3 variants, 18 pcs', 'তিন ভ্যারিয়েন্ট, ১৮ পিস')}
        </span>
      </button>
    </div>
  )
}
