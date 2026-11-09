import React, { useEffect, useMemo, useState } from 'react';
import { useStore, buildShopCategories } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import logoImg from '../asset/surokkha_logo_dark.png';
import AnnouncementMarquee from './AnnouncementMarquee';
import NavOfferCards from './NavOfferCards';
import { getCustomerToken, SESSION_EVENT } from '../utils/customerAuth';

// Mega-menu style navbar (dark). Mobile: hamburger on the left opens a left drawer.
const SurokkhaNavbar = () => {
  const currentView = useStore((state) => state.currentView);
  const navigateTo = useStore((state) => state.navigateTo);
  const toggleCartDrawer = useStore((state) => state.toggleCartDrawer);
  const cart = useStore((state) => state.cart);
  const allCategories = useStore((state) => state.categories);
  const products = useStore((state) => state.products);
  const productKeys = useStore((state) => state.productKeys);
  const { isBn } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getCustomerToken()));
  // Keep the drawer's account buttons in sync with sign-in / sign-out
  useEffect(() => {
    const sync = () => setIsLoggedIn(Boolean(getCustomerToken()));
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const itemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  // Lock page scroll while the drawer is open; close it with Escape
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const go = (view, param = null) => {
    setDrawerOpen(false);
    navigateTo(view, param);
  };

  // Shop categories: the real dashboard categories that have products (same list as the shop page filter)
  const shopCategories = useMemo(() => {
    const active = (productKeys || []).map((k) => products[k]).filter((p) => p && p.isActive !== false && p.status !== 'inactive');
    return [
      { slug: 'all', label: isBn ? 'সব প্রোডাক্ট' : 'All Products', depth: 0 },
      ...buildShopCategories(allCategories || [], active).map((c) => ({ slug: c.slug, label: isBn ? c.name_bn : c.name, depth: c.depth })),
    ];
  }, [allCategories, products, productKeys, isBn]);

  const links = [
    { view: 'home', label: isBn ? 'হোম' : 'Home' },
    { view: 'combo', label: isBn ? 'অফার' : 'Offers' },
    { view: 'faq', label: isBn ? 'প্রশ্নোত্তর' : 'FAQ' },
    { view: 'contact', label: isBn ? 'যোগাযোগ' : 'Contact' },
  ];

  const megaColumns = [
    {
      title: isBn ? 'শপ' : 'Shop',
      items: shopCategories.map((c) => ({ view: 'shop', param: c.slug, label: c.label, depth: c.depth })),
    },
  ];

  // Profile icon (thin outline)
  const ProfileIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );

  return (
    <>
      {/* Offer ticker above the header */}
      <AnnouncementMarquee />
      <header className="sticky top-0 z-40 bg-[var(--header-bg)] text-slate-100 border-b border-white/10">
        <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-8 lg:px-8 lg:py-0">
          {/* Hamburger (mobile, left) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 rounded-lg p-2 hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>

          {/* Logo */}
          <div className="shrink-0 lg:flex-1 lg:basis-0">
            <button type="button" onClick={() => go('home')} className="cursor-pointer lg:py-3">
              <img src={logoImg} alt="Surokkha Logo" className="h-8 w-auto object-contain sm:h-9 md:h-11" />
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-stretch justify-center gap-1 self-stretch text-base font-semibold lg:flex">
            <button
              type="button"
              onClick={() => go('home')}
              className={`flex items-center px-3 cursor-pointer ${currentView === 'home' ? 'text-rose-400' : 'hover:text-rose-400'}`}
            >
              {isBn ? 'হোম' : 'Home'}
            </button>
            {/* Mega trigger */}
            <div className="group flex items-stretch">
              <button
                type="button"
                onClick={() => go('shop')}
                className={`flex items-center gap-1 px-3 cursor-pointer ${currentView === 'shop' ? 'text-rose-400' : 'hover:text-rose-400'}`}
              >
                {isBn ? 'শপ' : 'Shop'}
                <svg className="h-4 w-4 transition group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </button>

              {/* Mega panel */}
              <div className="invisible absolute inset-x-0 top-full translate-y-2 border-t border-white/10 bg-white text-black opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 py-8">
                  {megaColumns.map((col) => (
                    <div key={col.title} className="col-span-4">
                      <p className="mb-3 text-sm font-extrabold uppercase tracking-wider text-black">{col.title}</p>
                      <ul className="space-y-2 text-base font-medium">
                        {col.items.map((it) => (
                          <li key={it.param || it.label} className={it.depth ? 'pl-4 text-[15px]' : ''}>
                            <button type="button" onClick={() => go(it.view, it.param)} className="hover:text-rose-600 cursor-pointer text-left">{it.label}</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="col-span-8">
                    <NavOfferCards onNavigate={() => setDrawerOpen(false)} />
                  </div>
                </div>
              </div>
            </div>

            {links.filter((l) => l.view !== 'home').map((l) => (
              <button
                key={l.view}
                type="button"
                onClick={() => go(l.view)}
                className={`flex items-center px-3 cursor-pointer ${currentView === l.view ? 'text-rose-400' : 'hover:text-rose-400'}`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center justify-end gap-1 sm:gap-2 lg:ml-0 lg:flex-1 lg:basis-0">
            <button
              type="button"
              onClick={() => go('account')}
              className="rounded-lg p-2 hover:bg-white/10 cursor-pointer"
              aria-label="Account"
            >
              <ProfileIcon />
            </button>
            <button
              type="button"
              onClick={toggleCartDrawer}
              className="relative flex items-center gap-2 rounded-lg p-2 hover:bg-white/10 cursor-pointer"
              aria-label="Cart"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
                <circle cx="10" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
              </svg>
              <span className="absolute left-6 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{itemCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Left drawer (mobile) */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? 'visible' : 'invisible'}`}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`drawer-scroll absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-[var(--header-bg)] text-slate-100 shadow-xl transition-transform duration-300 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <img src={logoImg} alt="Surokkha Logo" className="h-8 w-auto object-contain" />
            <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700 cursor-pointer" aria-label="Close">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <nav className="drawer-scroll flex-1 overflow-y-auto px-2 py-3 text-base">
            <button
              type="button"
              onClick={() => go('home')}
              className={`block w-full rounded-lg px-3 py-3 text-left cursor-pointer hover:bg-white/5 ${currentView === 'home' ? 'text-rose-400' : ''}`}
            >
              {isBn ? 'হোম' : 'Home'}
            </button>
            <details open className="rounded-lg [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg font-semibold text-rose-400 hover:bg-white/5">
                {/* Tapping the label opens the shop; the arrow opens/closes the categories */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); go('shop'); }}
                  className="flex-1 px-3 py-3 text-left cursor-pointer"
                >
                  {isBn ? 'শপ' : 'Shop'}
                </button>
                <span className="px-3 py-3" aria-label="Show categories">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </summary>
              <div className="pb-2 pl-3">
                {shopCategories.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => go('shop', c.slug)}
                    className={`block w-full rounded-lg py-2.5 text-left cursor-pointer hover:bg-white/5 ${c.depth ? 'pl-7 pr-3 text-white/80' : 'px-3'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </details>
            {[...links.filter((l) => l.view !== 'home'), { view: 'account', label: isBn ? 'অর্ডার ট্র্যাক' : 'Track Order' }].map((l) => (
              <button
                key={l.view + l.label}
                type="button"
                onClick={() => go(l.view)}
                className={`block w-full rounded-lg px-3 py-3 text-left cursor-pointer hover:bg-white/5 ${currentView === l.view ? 'text-rose-400' : ''}`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4 space-y-3">
            <NavOfferCards compact onNavigate={() => setDrawerOpen(false)} />
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => go('account')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 py-2.5 text-sm font-semibold cursor-pointer"
              >
                <ProfileIcon />
                My Account
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => go('account', 'login')}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/30 py-2.5 text-sm font-semibold text-white hover:bg-white/10 cursor-pointer"
                >
                  <ProfileIcon />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => go('account', 'signup')}
                  className="rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 py-2.5 text-sm font-semibold text-white cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default SurokkhaNavbar;
