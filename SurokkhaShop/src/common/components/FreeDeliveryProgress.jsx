import React from 'react';
import { FREE_DELIVERY_MIN } from '../store/useStore';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const price = (n, isBn) => '৳' + (isBn ? String(n).replace(/[0-9]/g, (d) => BN_DIGITS[d]) : String(n));

/** "Add ৳X more for free delivery" with a bar that fills up to the ৳1,000 free-delivery mark. */
export default function FreeDeliveryProgress({ subtotal = 0, isBn = true, className = '' }) {
  const reached = subtotal >= FREE_DELIVERY_MIN;
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_MIN) * 100));
  const left = Math.max(0, Math.ceil(FREE_DELIVERY_MIN - subtotal));

  return (
    <div className={`rounded-2xl border px-3.5 py-2.5 ${reached ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50/80 border-rose-200/80'} ${className}`}>
      <p className={`flex items-center gap-2 text-xs font-bold ${reached ? 'text-emerald-900' : 'text-slate-800'}`}>
        <span aria-hidden>🚚</span>
        {reached ? (
          <span>{isBn ? 'অভিনন্দন! আপনি ফ্রি ডেলিভারি পাচ্ছেন' : 'You got free delivery!'}</span>
        ) : isBn ? (
          <span>
            আরও <span className="text-[#b0213f] font-extrabold">{price(left, isBn)}</span> এর পণ্য যোগ করুন, ফ্রি ডেলিভারি পাবেন
          </span>
        ) : (
          <span>
            Add <span className="text-[#b0213f] font-extrabold">{price(left, isBn)}</span> more to get free delivery
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-white/80 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-emerald-500' : 'bg-[#b0213f]'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
