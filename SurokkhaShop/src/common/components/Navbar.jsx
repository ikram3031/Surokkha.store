import React from 'react';
import { useStore, getFeaturedCombo } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import logoLight from '../asset/logo.png';
import logoDark from '../asset/logo_v2.png';

// Header and navigation bar component
const Navbar = () => {
  const currentView = useStore((state) => state.currentView);
  const navigateTo = useStore((state) => state.navigateTo);
  const openProduct = useStore((state) => state.openProduct);
  const toggleCartDrawer = useStore((state) => state.toggleCartDrawer);
  const cart = useStore((state) => state.cart);
  const products = useStore((state) => state.products);
  const { t, isBn, formatPrice } = useTranslation();

  // Marquee offer shows the site-wide featured combo (Ultimate 3-in-1 30 pcs)
  const combo30Prod = getFeaturedCombo(products);

  const comboKey = combo30Prod?.slug || combo30Prod?.id || 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
  const comboPrice = combo30Prod ? (combo30Prod.offerPrice || combo30Prod.price) : null;
  const comboRegularPrice = combo30Prod ? (combo30Prod.regularPrice || combo30Prod.price) : null;
  const comboDiscountPct = (comboRegularPrice && comboPrice && comboRegularPrice > comboPrice)
    ? Math.round(((comboRegularPrice - comboPrice) / comboRegularPrice) * 100)
    : 0;
  
  const logoImg = logoDark;
  const itemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  return (
    <div className="sticky top-0 z-40">
      {/* Top Announcement Ticker - Light BG for store */}
      <div 
        className={`${
          'bg-gradient-to-r from-[#1b0710] via-[#330c1e] to-[#1b0710] hover:from-[#260a17] hover:via-[#421028] hover:to-[#260a17] text-white border-b border-rose-950/70'
        } text-xs py-1.5 select-none cursor-pointer transition-colors duration-200 overflow-hidden group`}
      >
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] items-center whitespace-nowrap">
          <div className="flex items-center shrink-0">
            <div 
              onClick={(e) => { e.stopPropagation(); openProduct(comboKey); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-amber-400`}>
                <span>🔥</span>
                <span>
                  {comboDiscountPct > 0 
                    ? (isBn ? `${comboDiscountPct}% স্পেশাল ডিসকাউন্ট!` : `${comboDiscountPct}% Special Discount!`)
                    : t('navbar.combo_banner_lead', 'স্পেশাল ডিসকাউন্ট!')}
                </span>
              </span>
              <span className={`font-semibold text-[11px] sm:text-xs text-rose-100/90`}>
                {isBn 
                  ? (comboPrice ? `৩০ পিস MO কম্বো প্যাক নিন মাত্র ${formatPrice(comboPrice)} টাকায়` : '৩০ পিস MO কম্বো প্যাক নিন বিশেষ ছাড়ে') 
                  : (comboPrice ? `Get 30 Pcs MO Combo Pack for only ${formatPrice(comboPrice)}` : 'Get 30 Pcs MO Combo Pack with Special Savings')}
              </span>
              <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] sm:text-xs underline underline-offset-4 transition-colors ${
                'text-amber-400 group-hover:text-amber-300 decoration-amber-400/80'
              }`}>
                <span>{t('navbar.combo_banner_action', 'অফারটি দেখুন →')}</span>
              </span>
              <span className={`text-rose-400/50 ml-6 text-xs font-bold`}>•</span>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); navigateTo('shop'); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-amber-300`}>
                <span>🎉</span>
                <span>{t('navbar.monthly_banner_lead', 'বিশেষ অফার!')}</span>
              </span>
              <span className={`font-semibold text-[11px] sm:text-xs text-rose-100/90`}>
                {t('navbar.monthly_banner_text', 'আমাদের সকল পণ্যে বিশেষ ছাড় উপভোগ করুন')}
              </span>
              <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] sm:text-xs underline underline-offset-4 transition-colors ${
                'text-amber-300 group-hover:text-amber-200 decoration-amber-300/80'
              }`}>
                <span>{t('navbar.monthly_banner_action', 'শপ দেখুন →')}</span>
              </span>
              <span className={`text-rose-400/50 ml-6 text-xs font-bold`}>•</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10">
              <span className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-emerald-300`}>
                <span>🚚</span>
                <span>{isBn ? 'ফ্রি ডেলিভারি!' : 'Free Delivery!'}</span>
              </span>
              <span className={`font-semibold text-[11px] sm:text-xs text-rose-100/90`}>
                {isBn ? '১০০০ টাকার উপরে সকল অর্ডারে ফ্রি ডেলিভারি, কুপন কোড ব্যবহার করুন:' : 'Free delivery on all orders above ৳1000, use coupon code:'}
              </span>
              <span className={`font-mono font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded border border-dashed text-emerald-200 border-emerald-400/70 bg-emerald-950/40`}>
                FREEOCT
              </span>
              <span className={`text-rose-400/50 ml-6 text-xs font-bold`}>•</span>
            </div>
          </div>

          <div className="flex items-center shrink-0" aria-hidden="true">
            <div 
              onClick={(e) => { e.stopPropagation(); openProduct(comboKey); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-amber-400`}>
                <span>🔥</span>
                <span>
                  {comboDiscountPct > 0 
                    ? (isBn ? `${comboDiscountPct}% স্পেশাল ডিসকাউন্ট!` : `${comboDiscountPct}% Special Discount!`)
                    : t('navbar.combo_banner_lead', 'স্পেশাল ডিসকাউন্ট!')}
                </span>
              </span>
              <span className={`font-semibold text-[11px] sm:text-xs text-rose-100/90`}>
                {isBn 
                  ? (comboPrice ? `৩০ পিস MO কম্বো প্যাক নিন মাত্র ${formatPrice(comboPrice)} টাকায়` : '৩০ পিস MO কম্বো প্যাক নিন বিশেষ ছাড়ে') 
                  : (comboPrice ? `Get 30 Pcs MO Combo Pack for only ${formatPrice(comboPrice)}` : 'Get 30 Pcs MO Combo Pack with Special Savings')}
              </span>
              <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] sm:text-xs underline underline-offset-4 transition-colors ${
                'text-amber-400 group-hover:text-amber-300 decoration-amber-400/80'
              }`}>
                <span>{t('navbar.combo_banner_action', 'অফারটি দেখুন →')}</span>
              </span>
              <span className={`text-rose-400/50 ml-6 text-xs font-bold`}>•</span>
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); navigateTo('shop'); }}
              className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-amber-300`}>
                <span>🎉</span>
                <span>{t('navbar.monthly_banner_lead', 'বিশেষ অফার!')}</span>
              </span>
              <span className={`font-semibold text-[11px] sm:text-xs text-rose-100/90`}>
                {t('navbar.monthly_banner_text', 'আমাদের সকল পণ্যে বিশেষ ছাড় উপভোগ করুন')}
              </span>
              <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] sm:text-xs underline underline-offset-4 transition-colors ${
                'text-amber-300 group-hover:text-amber-200 decoration-amber-300/80'
              }`}>
                <span>{t('navbar.monthly_banner_action', 'শপ দেখুন →')}</span>
              </span>
              <span className={`text-rose-400/50 ml-6 text-xs font-bold`}>•</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 px-6 sm:px-10">
              <span className={`inline-flex items-center gap-1 font-bold text-[11px] sm:text-xs text-emerald-300`}>
                <span>🚚</span>
                <span>{isBn ? 'ফ্রি ডেলিভারি!' : 'Free Delivery!'}</span>
              </span>
              <span className={`font-semibold text-[11px] sm:text-xs text-rose-100/90`}>
                {isBn ? '১০০০ টাকার উপরে সকল অর্ডারে ফ্রি ডেলিভারি, কুপন কোড ব্যবহার করুন:' : 'Free delivery on all orders above ৳1000, use coupon code:'}
              </span>
              <span className={`font-mono font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded border border-dashed text-emerald-200 border-emerald-400/70 bg-emerald-950/40`}>
                FREEOCT
              </span>
              <span className={`text-rose-400/50 ml-6 text-xs font-bold`}>•</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav: Dark with subtle glassmorphism */}
      <header className="bg-[#14050e]/85 backdrop-blur-xl backdrop-saturate-150 border-b border-rose-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => navigateTo('home')} className="group flex items-center focus:outline-none cursor-pointer">
              <img 
                src={logoImg} 
                alt="Surokkha Logo" 
                className="h-8 sm:h-9 md:h-11 w-auto object-contain drop-shadow-sm group-hover:opacity-95 transition"
              />
            </button>
          </div>

          {/* Navigation Links - Clear & High Contrast */}
          <nav className="hidden md:flex items-center justify-center gap-2 sm:gap-3 text-sm flex-1">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'text-white bg-gradient-to-r from-rose-600 to-rose-700 shadow-[0_2px_14px_rgba(244,63,94,0.5)] border border-rose-400/40'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop')}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer ${
                currentView === 'shop'
                  ? 'text-white bg-gradient-to-r from-rose-600 to-rose-700 shadow-[0_2px_14px_rgba(244,63,94,0.5)] border border-rose-400/40'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Shop
            </button>

            <button
              type="button"
              onClick={() => navigateTo('combo')}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'combo'
                  ? 'text-slate-950 bg-amber-400 shadow-[0_2px_14px_rgba(245,158,11,0.5)] border border-amber-300 font-extrabold'
                  : 'text-amber-300 bg-amber-500/15 border border-amber-400/50 hover:bg-amber-500/25 hover:text-amber-200'
              }`}
            >
              <span className="text-sm">🔥</span>
              <span>Offers</span>
            </button>
          </nav>

          {/* Cart Button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button 
              type="button"
              onClick={toggleCartDrawer} 
              aria-label={t('navbar.cart', 'Cart')}
              title={t('navbar.cart', 'Cart')}
              className="relative p-2 text-rose-200 hover:text-white transition-colors flex items-center justify-center cursor-pointer active:scale-95"
            >
              <svg className="w-7 h-7 text-rose-200 hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 016 0v.75a.75.75 0 01-1.5 0v-.75a1.5 1.5 0 00-3 0v.75a.75.75 0 01-1.5 0v-.75z" clipRule="evenodd" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#14050e]/80 shadow-[0_0_10px_rgba(225,29,72,0.5)]">
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
