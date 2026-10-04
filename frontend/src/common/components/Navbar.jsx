import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { SITE_CONFIG } from '../config/siteConfig';
import logoLight from '../asset/logo.png';
import logoDark from '../asset/logo_v2.png';

// Header and navigation bar component
const Navbar = () => {
  const currentView = useStore((state) => state.currentView);
  const navigateTo = useStore((state) => state.navigateTo);
  const openProduct = useStore((state) => state.openProduct);
  const toggleCartDrawer = useStore((state) => state.toggleCartDrawer);
  const cart = useStore((state) => state.cart);
  const { t } = useTranslation();
  
  const isStore = Boolean(SITE_CONFIG.isStore);
  const logoImg = isStore ? logoDark : logoLight;
  const itemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <div className="sticky top-0 z-40 shadow-xs">
      <div 
        className={`${
          isStore
            ? 'bg-gradient-to-r from-[#fff5f6] via-[#ffeef1] to-[#fff5f6] hover:from-[#fae3e7] hover:via-[#f8d7dc] hover:to-[#fae3e7] text-slate-900 border-b border-rose-200/90'
            : 'bg-gradient-to-r from-[#1b0710] via-[#330c1e] to-[#1b0710] hover:from-[#260a17] hover:via-[#421028] hover:to-[#260a17] text-white border-b border-rose-950/70'
        } text-xs sm:text-sm py-2 select-none cursor-pointer transition-colors duration-200 overflow-hidden group`}
      >
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center whitespace-nowrap">
          <div className="flex items-center shrink-0">
            <div 
              onClick={(e) => { e.stopPropagation(); openProduct('variety-condoms-30pcs-combo'); }}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-12 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1.5 font-bold ${isStore ? 'text-rose-700' : 'text-amber-400'}`}>
                <span className="animate-pulse">🔥</span>
                <span>{t('navbar.combo_banner_lead', '২৫% স্পেশাল ডিসকাউন্ট!')}</span>
              </span>
              <span className={`font-semibold ${isStore ? 'text-slate-800' : 'text-rose-100/90'}`}>
                {t('navbar.combo_banner_text', '৩০ পিস MO কম্বো প্যাক নিন মাত্র ৯০০ টাকায়')}
              </span>
              <span className={`inline-flex items-center gap-1 font-bold underline underline-offset-4 transition-colors ${
                isStore
                  ? 'text-rose-700 group-hover:text-rose-900 decoration-rose-500'
                  : 'text-amber-400 group-hover:text-amber-300 decoration-amber-400/80'
              }`}>
                <span>{t('navbar.combo_banner_action', 'অফারটি দেখুন →')}</span>
              </span>
              <span className={`${isStore ? 'text-rose-300' : 'text-rose-400/50'} ml-6 font-bold`}>•</span>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); navigateTo('shop'); }}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-12 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1.5 font-bold ${isStore ? 'text-amber-700' : 'text-amber-300'}`}>
                <span className="animate-pulse">🎉</span>
                <span>{t('navbar.monthly_banner_lead', 'মাসব্যাপী অফার!')}</span>
              </span>
              <span className={`font-semibold ${isStore ? 'text-slate-800' : 'text-rose-100/90'}`}>
                {t('navbar.monthly_banner_text', 'আমাদের সকল পণ্যে সেপ্টেম্বর মাসব্যাপী ডিসকাউন্ট পাচ্ছেন')}
              </span>
              <span className={`inline-flex items-center gap-1 font-bold underline underline-offset-4 transition-colors ${
                isStore
                  ? 'text-amber-700 group-hover:text-amber-900 decoration-amber-500'
                  : 'text-amber-300 group-hover:text-amber-200 decoration-amber-300/80'
              }`}>
                <span>{t('navbar.monthly_banner_action', 'শপ দেখুন →')}</span>
              </span>
              <span className={`${isStore ? 'text-rose-300' : 'text-rose-400/50'} ml-6 font-bold`}>•</span>
            </div>
          </div>

          <div className="flex items-center shrink-0" aria-hidden="true">
            <div 
              onClick={(e) => { e.stopPropagation(); openProduct('variety-condoms-30pcs-combo'); }}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-12 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1.5 font-bold ${isStore ? 'text-rose-700' : 'text-amber-400'}`}>
                <span className="animate-pulse">🔥</span>
                <span>{t('navbar.combo_banner_lead', '২৫% স্পেশাল ডিসকাউন্ট!')}</span>
              </span>
              <span className={`font-semibold ${isStore ? 'text-slate-800' : 'text-rose-100/90'}`}>
                {t('navbar.combo_banner_text', '৩০ পিস MO কম্বো প্যাক নিন মাত্র ৯০০ টাকায়')}
              </span>
              <span className={`inline-flex items-center gap-1 font-bold underline underline-offset-4 transition-colors ${
                isStore
                  ? 'text-rose-700 group-hover:text-rose-900 decoration-rose-500'
                  : 'text-amber-400 group-hover:text-amber-300 decoration-amber-400/80'
              }`}>
                <span>{t('navbar.combo_banner_action', 'অফারটি দেখুন →')}</span>
              </span>
              <span className={`${isStore ? 'text-rose-300' : 'text-rose-400/50'} ml-6 font-bold`}>•</span>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); navigateTo('shop'); }}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-12 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1.5 font-bold ${isStore ? 'text-amber-700' : 'text-amber-300'}`}>
                <span className="animate-pulse">🎉</span>
                <span>{t('navbar.monthly_banner_lead', 'মাসব্যাপী অফার!')}</span>
              </span>
              <span className={`font-semibold ${isStore ? 'text-slate-800' : 'text-rose-100/90'}`}>
                {t('navbar.monthly_banner_text', 'আমাদের সকল পণ্যে সেপ্টেম্বর মাসব্যাপী ডিসকাউন্ট পাচ্ছেন')}
              </span>
              <span className={`inline-flex items-center gap-1 font-bold underline underline-offset-4 transition-colors ${
                isStore
                  ? 'text-amber-700 group-hover:text-amber-900 decoration-amber-500'
                  : 'text-amber-300 group-hover:text-amber-200 decoration-amber-300/80'
              }`}>
                <span>{t('navbar.monthly_banner_action', 'শপ দেখুন →')}</span>
              </span>
              <span className={`${isStore ? 'text-rose-300' : 'text-rose-400/50'} ml-6 font-bold`}>•</span>
            </div>
          </div>
        </div>
      </div>

      <header className={`${
        isStore 
          ? 'bg-[#14050e]/95 backdrop-blur-md border-b border-rose-950/80 shadow-md' 
          : 'bg-[#faf5f6]/95 backdrop-blur-md border-b border-rose-200/70 shadow-xs'
      } transition-all`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          
          <div className="flex-shrink-0">
            <button onClick={() => navigateTo('home')} className="group flex items-center focus:outline-none cursor-pointer">
              <img 
                src={logoImg} 
                alt="Surokkha Logo" 
                className="h-8 sm:h-9 md:h-11 w-auto object-contain drop-shadow-sm group-hover:opacity-95 transition"
              />
            </button>
          </div>

          <nav className="hidden md:flex items-center justify-center gap-2 text-sm flex-1">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                isStore
                  ? currentView === 'home'
                    ? 'text-white bg-rose-950/90 border border-rose-700/80 shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-rose-950/50'
                  : currentView === 'home'
                    ? 'text-black bg-rose-100/90 border border-rose-300 shadow-xs'
                    : 'text-slate-900 hover:text-black hover:bg-rose-50/80'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop')}
              className={`px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                isStore
                  ? currentView === 'shop'
                    ? 'text-white bg-rose-950/90 border border-rose-700/80 shadow-xs'
                    : 'text-slate-200 hover:text-white hover:bg-rose-950/50'
                  : currentView === 'shop'
                    ? 'text-black bg-rose-100/90 border border-rose-300 shadow-xs'
                    : 'text-slate-900 hover:text-black hover:bg-rose-50/80'
              }`}
            >
              Shop
            </button>

            <button
              type="button"
              onClick={() => navigateTo('combo')}
              className={`px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                isStore
                  ? currentView === 'combo'
                    ? 'text-amber-300 bg-amber-950/90 border border-amber-500/80 shadow-xs'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/50 border border-amber-500/40'
                  : currentView === 'combo'
                    ? 'text-black bg-amber-200/90 border border-amber-400 shadow-xs'
                    : 'text-slate-900 hover:text-black hover:bg-amber-100/70 border border-amber-300/80'
              }`}
            >
              <span>🔥</span>
              <span>Offers</span>
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button 
              type="button"
              onClick={toggleCartDrawer} 
              aria-label={t('navbar.cart', 'Cart')}
              title={t('navbar.cart', 'Cart')}
              className={`relative p-2 ${
                isStore ? 'text-rose-200 hover:text-white' : 'text-brand-800 hover:text-brand-600'
              } transition-colors flex items-center justify-center cursor-pointer active:scale-95`}
            >
              <svg className={`w-7 h-7 ${isStore ? 'text-rose-200 hover:text-white' : 'text-brand-800 hover:text-brand-700'} transition-colors`} viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 016 0v.75a.75.75 0 01-1.5 0v-.75a1.5 1.5 0 00-3 0v.75a.75.75 0 01-1.5 0v-.75z" clipRule="evenodd" />
              </svg>
              <span className={`absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ${
                isStore ? 'ring-[#14050e]' : 'ring-white'
              }`}>
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
