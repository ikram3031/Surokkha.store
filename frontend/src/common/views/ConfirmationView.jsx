import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

export default function ConfirmationView() {
  const { t } = useTranslation();
  const lastOrder = useStore((state) => state.lastOrder);
  const navigateTo = useStore((state) => state.navigateTo);
  const products = useStore((state) => state.products);

  if (!lastOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900">{t('confirmation.no_order_title')}</h2>
        <button 
          onClick={() => navigateTo('home')} 
          className="bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-bold py-3 px-6 rounded-xl shadow-xs transition cursor-pointer"
        >
          {t('confirmation.return_home')}
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-fade-in">
      <div className="max-w-2xl mx-auto text-center space-y-8">
      
      <div className="w-16 h-16 bg-brand-50 text-brand-800 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-brand-100">
        <svg className="w-8 h-8 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-brand-800 tracking-wider uppercase bg-brand-50 px-3 py-1 rounded-full border border-brand-200">{t('confirmation.order_confirmed')}</span>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">{t('confirmation.thank_you')}</h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {t('confirmation.description')}
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-left shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">{t('confirmation.order_reference')}</span>
            <span className="text-base font-bold text-slate-900 font-mono">{lastOrder.orderId}</span>
            <span className="text-[10px] text-slate-600 block font-mono mt-0.5">{lastOrder.timestamp || lastOrder.date}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">{t('confirmation.payment_method')}</span>
            <span className="text-xs font-semibold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md inline-block mt-0.5">{t('confirmation.cod')}</span>
          </div>
        </div>

        {/* Ordered Products */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">{t('confirmation.ordered_items')}</h4>
          <div className="space-y-2.5">
            {Object.keys(lastOrder.items).map((slug) => {
              const p = products[slug] || { name: slug, price: 0 };
              const q = lastOrder.items[slug];
              return (
                <div key={slug} className="flex justify-between items-baseline text-xs py-1 border-b border-slate-50">
                  <span className="text-slate-800 font-medium">{p.name} × {q}</span>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="font-bold text-slate-900">৳{p.price * q}</span>
                    {p.regularPrice > p.price && (
                      <span className="text-[11px] text-slate-500 line-through font-medium">৳{p.regularPrice * q}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Amount */}
        <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-700 font-medium">
            <span>{t('confirmation.subtotal')}</span>
            <span className="font-mono text-slate-900 font-bold">৳{lastOrder.totals.subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-700 font-medium">
            <span>{t('confirmation.delivery_charge')}</span>
            <span className="font-mono text-slate-900 font-bold">৳{lastOrder.totals.deliveryFee}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
            <span>{t('confirmation.total_payable')}</span>
            <span className="text-lg text-brand-800 font-mono">৳{lastOrder.totals.grandTotal}</span>
          </div>
        </div>

        {/* Billing & Destination Recap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Billing Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-800 space-y-1">
            <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px]">{t('confirmation.billing_details')}</span>
            <p><strong>{t('confirmation.name')}</strong> {lastOrder.customer?.name}</p>
            <p><strong>{t('confirmation.mobile')}</strong> <span className="font-mono">{lastOrder.customer?.mobile}</span></p>
            {lastOrder.customer?.email && <p><strong>{t('confirmation.email')}</strong> {lastOrder.customer?.email}</p>}
            <p><strong>{t('confirmation.address')}</strong> {lastOrder.customer?.address}</p>
            <p><strong>{t('confirmation.district')}</strong> {lastOrder.customer?.district} {lastOrder.customer?.thana ? `(${lastOrder.customer.thana})` : ''}</p>
          </div>

          {/* Shipping Recipient Details (if different) */}
          {lastOrder.shipToDifferentAddress && lastOrder.shippingRecipient ? (
            <div className="bg-brand-50/50 rounded-2xl p-4 border border-brand-200/80 text-xs text-slate-800 space-y-1">
              <span className="font-bold text-brand-900 block mb-1 uppercase tracking-wider text-[11px]">{t('confirmation.shipping_destination')}</span>
              <p><strong>{t('confirmation.recipient')}</strong> {lastOrder.shippingRecipient.name}</p>
              <p><strong>{t('confirmation.phone')}</strong> <span className="font-mono">{lastOrder.shippingRecipient.mobile}</span></p>
              <p><strong>{t('confirmation.address')}</strong> {lastOrder.shippingRecipient.address}</p>
              <p><strong>{t('confirmation.district')}</strong> {lastOrder.shippingRecipient.district} {lastOrder.shippingRecipient.thana ? `(${lastOrder.shippingRecipient.thana})` : ''}</p>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-800 space-y-1 flex flex-col justify-center">
              <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[11px]">{t('confirmation.delivery_option')}</span>
              <p>{t('confirmation.delivery_direct')}</p>
            </div>
          )}
        </div>

        {/* Order Notes if provided */}
        {lastOrder.orderNotes && (
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-800">
            <strong className="text-slate-900">{t('confirmation.order_note')}</strong> {lastOrder.orderNotes}
          </div>
        )}

        {/* Discreet packaging note */}
        <div className="bg-brand-50/70 border border-brand-200/80 rounded-2xl p-4 text-xs text-brand-950 flex items-start gap-3">
          <span className="text-brand-800 font-bold text-sm">📦</span>
          <p className="leading-relaxed">
            <strong>{t('confirmation.discreet_reassurance')}</strong> {t('confirmation.discreet_desc')}
          </p>
        </div>

      </div>

      <div className="pt-2">
        <button 
          onClick={() => navigateTo('home')} 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-3.5 px-8 rounded-xl transition cursor-pointer"
        >
          {t('confirmation.return_store')}
        </button>
      </div>

      </div>
    </div>
  );
}

