import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

export default function FloatingCart() {
  const navigateTo = useStore((state) => state.navigateTo);
  const openCartDrawer = useStore((state) => state.openCartDrawer);
  const isCartDrawerOpen = useStore((state) => state.isCartDrawerOpen);
  const currentView = useStore((state) => state.currentView);
  const getCartTotals = useStore((state) => state.getCartTotals);
  const { isBn } = useTranslation();
  const totals = getCartTotals();

  if (isCartDrawerOpen || currentView === 'checkout' || currentView === 'confirmation' || totals.itemCount <= 0) {
    return null;
  }

  const formatPrice = (val) => {
    const num = Number(val) || 0;
    if (isBn) {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return '৳' + String(num).replace(/[0-9]/g, (d) => bnDigits[d]);
    }
    return `৳${num}`;
  };

  return (
    <>
      {/* Mobile Sticky Bottom Floating Cart Bar */}
      <div className="sm:hidden fixed bottom-16 inset-x-3 z-40 animate-fade-in">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 px-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div 
            onClick={openCartDrawer}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-rose-400 text-slate-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                {totals.itemCount}
              </span>
            </div>
            <div>
              <div className="text-[11px] text-slate-300">
                {isBn ? `${totals.itemCount}টি আইটেম` : `${totals.itemCount} items`}
              </div>
              <div className="text-sm font-extrabold text-white font-heading">
                {formatPrice(totals.subtotal)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openCartDrawer}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-2 rounded-xl transition cursor-pointer"
            >
              {isBn ? 'কার্ট' : 'Cart'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('checkout')}
              className="bg-gradient-to-r from-brand-600 via-rose-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition active:scale-98 cursor-pointer flex items-center gap-1"
            >
              <span>{isBn ? 'অর্ডার করুন' : 'Checkout'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Floating Cart Pill (Bottom Right) */}
      <div id="floatingCartContainer" className="hidden sm:block fixed bottom-6 right-5 z-40 animate-fade-in">
        <button 
          onClick={openCartDrawer} 
          aria-label="Open Shopping Cart" 
          className="group relative flex items-center gap-3 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-brand-900 hover:to-slate-950 text-white pl-4 pr-5 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 active:translate-y-0 border border-slate-700/80 hover:border-brand-500/60 focus:outline-none cursor-pointer"
        >
          <div className="relative">
            <svg className="w-5 h-5 text-rose-400 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-slate-900">
              {totals.itemCount}
            </span>
          </div>
          <div className="text-left">
            <span className="text-[11px] text-slate-300 font-medium block leading-tight">{isBn ? 'কার্ট সাবটোটাল' : 'Cart Subtotal'}</span>
            <span className="text-xs font-bold text-white font-heading">{formatPrice(totals.subtotal)}</span>
          </div>
          <span className="text-xs font-bold text-rose-400 group-hover:text-rose-300 transition pl-1">
            →
          </span>
        </button>
      </div>
    </>
  );
}
