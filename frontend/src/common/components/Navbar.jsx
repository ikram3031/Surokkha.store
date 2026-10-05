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
  const logoImg = logoDark;
  const itemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <div className="sticky top-0 z-40">
      {/* Slim Modern Announcement Ticker */}
      <div className="bg-[#0b0307]/90 backdrop-blur-md text-white border-b border-white/[0.06] text-xs py-1.5 select-none cursor-pointer transition-colors duration-200 overflow-hidden group">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center whitespace-nowrap">
          <div className="flex items-center shrink-0">
            <div 
              onClick={(e) => { e.stopPropagation(); openProduct('variety-condoms-30pcs-combo'); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-rose-400 text-[11px] sm:text-xs">
                <span>🔥</span>
                <span>{t('navbar.combo_banner_lead', '২৫% স্পেশাল ডিসকাউন্ট!')}</span>
              </span>
              <span className="text-white/80 font-normal text-[11px] sm:text-xs">
                {t('navbar.combo_banner_text', '৩০ পিস MO কম্বো প্যাক নিন মাত্র ৯০০ টাকায়')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-rose-400 hover:text-rose-300 font-medium text-[11px] sm:text-xs underline underline-offset-4 decoration-rose-400/50 transition-colors">
                <span>{t('navbar.combo_banner_action', 'অফারটি দেখুন →')}</span>
              </span>
              <span className="text-white/20 ml-6 text-xs">•</span>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); navigateTo('shop'); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400 text-[11px] sm:text-xs">
                <span>🎉</span>
                <span>{t('navbar.monthly_banner_lead', 'মাসব্যাপী অফার!')}</span>
              </span>
              <span className="text-white/80 font-normal text-[11px] sm:text-xs">
                {t('navbar.monthly_banner_text', 'আমাদের সকল পণ্যে সেপ্টেম্বর মাসব্যাপী ডিসকাউন্ট পাচ্ছেন')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 font-medium text-[11px] sm:text-xs underline underline-offset-4 decoration-amber-400/50 transition-colors">
                <span>{t('navbar.monthly_banner_action', 'শপ দেখুন →')}</span>
              </span>
              <span className="text-white/20 ml-6 text-xs">•</span>
            </div>
          </div>

          <div className="flex items-center shrink-0" aria-hidden="true">
            <div 
              onClick={(e) => { e.stopPropagation(); openProduct('variety-condoms-30pcs-combo'); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-rose-400 text-[11px] sm:text-xs">
                <span>🔥</span>
                <span>{t('navbar.combo_banner_lead', '২৫% স্পেশাল ডিসকাউন্ট!')}</span>
              </span>
              <span className="text-white/80 font-normal text-[11px] sm:text-xs">
                {t('navbar.combo_banner_text', '৩০ পিস MO কম্বো প্যাক নিন মাত্র ৯০০ টাকায়')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-rose-400 hover:text-rose-300 font-medium text-[11px] sm:text-xs underline underline-offset-4 decoration-rose-400/50 transition-colors">
                <span>{t('navbar.combo_banner_action', 'অফারটি দেখুন →')}</span>
              </span>
              <span className="text-white/20 ml-6 text-xs">•</span>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); navigateTo('shop'); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400 text-[11px] sm:text-xs">
                <span>🎉</span>
                <span>{t('navbar.monthly_banner_lead', 'মাসব্যাপী অফার!')}</span>
              </span>
              <span className="text-white/80 font-normal text-[11px] sm:text-xs">
                {t('navbar.monthly_banner_text', 'আমাদের সকল পণ্যে সেপ্টেম্বর মাসব্যাপী ডিসকাউন্ট পাচ্ছেন')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 font-medium text-[11px] sm:text-xs underline underline-offset-4 decoration-amber-400/50 transition-colors">
                <span>{t('navbar.monthly_banner_action', 'শপ দেখুন →')}</span>
              </span>
              <span className="text-white/20 ml-6 text-xs">•</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Frosted Dark Glass Header */}
      <header className="bg-black/65 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => navigateTo('home')} className="group flex items-center focus:outline-none cursor-pointer">
              <img 
                src={logoImg} 
                alt="Surokkha Logo" 
                className="h-8 sm:h-9 md:h-10 w-auto object-contain drop-shadow-sm group-hover:opacity-90 transition-opacity"
              />
            </button>
          </div>

          {/* Unified Sleek Navigation Links */}
          <nav className="hidden md:flex items-center justify-center gap-1 sm:gap-2 text-sm flex-1">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`px-4 py-1.5 rounded-full font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer ${
                currentView === 'home'
                  ? 'text-white bg-white/15 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-md'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop')}
              className={`px-4 py-1.5 rounded-full font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer ${
                currentView === 'shop'
                  ? 'text-white bg-white/15 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-md'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              Shop
            </button>

            <button
              type="button"
              onClick={() => navigateTo('combo')}
              className={`px-4 py-1.5 rounded-full font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                currentView === 'combo'
                  ? 'text-rose-200 bg-rose-500/20 border border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)] backdrop-blur-md font-semibold'
                  : 'text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10'
              }`}
            >
              <span className="text-xs">🔥</span>
              <span>Offers</span>
            </button>
          </nav>

          {/* Luxury Frosted Cart Action */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button 
              type="button"
              onClick={toggleCartDrawer} 
              aria-label={t('navbar.cart', 'Cart')}
              title={t('navbar.cart', 'Cart')}
              className="relative p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/90 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 016 0v.75a.75.75 0 01-1.5 0v-.75a1.5 1.5 0 00-3 0v.75a.75.75 0 01-1.5 0v-.75z" clipRule="evenodd" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(225,29,72,0.4)] ring-2 ring-black">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
