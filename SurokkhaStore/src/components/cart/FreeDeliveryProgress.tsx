import { Truck } from 'lucide-react'
import { FREE_SHIP_AT } from '@/data/products'
import { taka } from '@/lib/bn'
import { L } from '@/lib/i18n'

/** "Add ৳X more for free delivery" with a bar that fills up to the ৳1,000 free-delivery mark. */
export function FreeDeliveryProgress({ subtotal, className = '' }: { subtotal: number; className?: string }) {
  const reached = subtotal >= FREE_SHIP_AT
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIP_AT) * 100))
  const left = FREE_SHIP_AT - subtotal

  return (
    <div className={`rounded-xl bg-secondary/60 px-3 py-2.5 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Truck className={`h-4 w-4 shrink-0 ${reached ? 'text-emerald-600' : 'text-primary'}`} aria-hidden />
        {reached ? (
          <span className="text-emerald-700">{L('You got free delivery!', 'আপনি ফ্রি ডেলিভারি পাচ্ছেন!')}</span>
        ) : (
          <span>
            {L('Add ', 'আরও ')}
            <span className="font-bold text-primary">{taka(left)}</span>
            {L(' more to get free delivery', ' এর পণ্য যোগ করুন, ফ্রি ডেলিভারি পাবেন')}
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
