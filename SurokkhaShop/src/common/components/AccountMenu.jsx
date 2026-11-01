import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { SESSION_EVENT, fetchCurrentCustomer, getCustomerToken, logoutCustomer } from '../utils/customerAuth';

// Profile icon in the header. Logged out: goes to the log in / sign up page.
// Logged in: opens a small menu with the customer's details, the dashboard and log out.
export default function AccountMenu() {
  const { isBn } = useTranslation();
  const navigateTo = useStore((state) => state.navigateTo);
  const currentView = useStore((state) => state.currentView);
  const [customer, setCustomer] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!getCustomerToken()) {
        setCustomer(null);
        return;
      }
      fetchCurrentCustomer().then((c) => {
        if (!cancelled) setCustomer(c);
      });
    };
    refresh();
    window.addEventListener(SESSION_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const go = (view) => {
    setOpen(false);
    navigateTo(view);
  };

  const itemClass = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100 cursor-pointer';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (customer ? setOpen((o) => !o) : navigateTo('account'))}
        aria-label={isBn ? 'অ্যাকাউন্ট' : 'Account'}
        title={isBn ? 'অ্যাকাউন্ট' : 'Account'}
        className={`p-2 transition-colors flex items-center justify-center cursor-pointer active:scale-95 ${
          currentView === 'account' ? 'text-white' : 'text-rose-200 hover:text-white'
        }`}
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
      </button>

      {customer && open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl">
          <div className="border-b border-slate-200 px-3 pb-3 pt-2">
            <p className="truncate font-bold">{customer.name}</p>
            <p className="truncate text-sm text-slate-500">{customer.email}</p>
            {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
          </div>
          <div className="pt-2">
            <button type="button" className={itemClass} onClick={() => go('account')}>
              {isBn ? 'প্রোফাইল ড্যাশবোর্ড' : 'Profile dashboard'}
            </button>
            <button
              type="button"
              className={`${itemClass} text-red-600`}
              onClick={() => {
                logoutCustomer();
                go('home');
              }}
            >
              {isBn ? 'লগ আউট' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
