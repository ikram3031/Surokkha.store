import { navigate } from '@/lib/router'
import { L, toBnDigits } from '@/lib/i18n'

const MEGA_COMBO_SLUG = 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo'
const TRIAL_PACK_SLUG = 'surokkha-trial-pack'

// Two promotional offer cards shown in the mobile navigation drawer above My Account.
export const NavOfferCards = ({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) => {
  const megaPrice = 950
  const megaOld = 1350
  const megaSave = megaOld - megaPrice
  const megaPct = Math.round((megaSave / megaOld) * 100)
  const trialPrice = 299

  const open = (slug: string) => {
    if (onNavigate) onNavigate()
    navigate(`/product/${slug}`)
  }

  return (
    <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-4'}`}>
      <button
        type="button"
        onClick={() => open(MEGA_COMBO_SLUG)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-rose-600 to-[#4a0d24] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        <span className={`rounded-full bg-amber-400 font-extrabold text-black ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          🔥 {L(`${megaPct}% OFF`, `${toBnDigits(megaPct)}% ছাড়`)}
        </span>
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {L('30 pcs Mega Combo', '৩০ পিস মেগা কম্বো')}
        </span>
        <span className={`mt-1 flex items-baseline gap-1.5 ${compact ? '' : 'mt-2'}`}>
          <span className={`font-black ${compact ? 'text-lg' : 'text-3xl'}`}>৳{L(String(megaPrice), toBnDigits(megaPrice))}</span>
          <span className={`line-through text-white/70 ${compact ? 'text-xs' : 'text-base'}`}>৳{L(String(megaOld), toBnDigits(megaOld))}</span>
        </span>
        <span className={`mt-1 font-bold text-amber-300 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {L(`Save ৳${megaSave}`, `৳${toBnDigits(megaSave)} সাশ্রয়`)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => open(TRIAL_PACK_SLUG)}
        className={`flex flex-col items-start rounded-2xl bg-gradient-to-br from-emerald-600 to-[#064e3b] text-left text-white cursor-pointer hover:brightness-110 transition ${compact ? 'p-3' : 'p-5'}`}
      >
        <span className={`rounded-full bg-white font-extrabold text-emerald-800 ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          🚚 {L('Free Delivery', 'ফ্রি ডেলিভারি')}
        </span>
        <span className={`mt-2 font-extrabold leading-tight ${compact ? 'text-sm' : 'text-xl'}`}>
          {L('Surokkha Trial Pack', 'সুরক্ষা ট্রায়াল প্যাক')}
        </span>
        <span className={`mt-1 font-black ${compact ? 'text-lg' : 'text-3xl mt-2'}`}>
          ৳{L(String(trialPrice), toBnDigits(trialPrice))}
        </span>
        <span className={`mt-1 font-bold text-emerald-100 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {L('6 variants, 12 pcs', '৬ ভ্যারিয়েন্ট, ১২ পিস')}
        </span>
      </button>
    </div>
  )
}
