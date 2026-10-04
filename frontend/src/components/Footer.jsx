import React from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import logoV2 from '../asset/logo_v2.png';

export default function Footer() {
  const navigateTo = useStore((state) => state.navigateTo);
  const { t, isBn } = useTranslation();

  return (
    <footer className="block bg-gradient-to-b from-[#18050e] via-[#12040b] to-[#0a0206] text-white pt-12 pb-12 border-t border-rose-950/80 mt-16 text-sm text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top 18+ Age Notice Strip */}
        <div className="mb-8 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              18+
            </span>
            <span className="text-white font-medium">
              {isBn 
                ? '🔞 শুধুমাত্র ১৮+ প্রাপ্তবয়স্ক ও বিবাহিত দম্পতিদের পরিবার পরিকল্পনার জন্য উদ্দিষ্ট।' 
                : '🔞 Intended strictly for legal adults aged 18+ and family planning.'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{isBn ? '১০০% গোপনীয় আনলেবেলড ডেলিভারি' : '100% Discreet Unlabeled Delivery'}</span>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-rose-900/40">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-3">
            <div className="cursor-pointer inline-block" onClick={() => navigateTo('home')}>
              <img src={logoV2} alt="Surokkha" className="h-8 sm:h-10 w-auto object-contain hover:opacity-90 transition-opacity" />
            </div>
            <p className="text-xs text-white/90 leading-relaxed pr-4 font-normal">
              {t('footer.about_desc')}
            </p>
          </div>

          {/* Column 2: Quick Links (English Only) */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-white/90 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('terms')}
                  className="hover:text-amber-300 text-white/90 hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-400">›</span>
                  <span>Terms & Conditions</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('privacy')}
                  className="hover:text-amber-300 text-white/90 hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-400">›</span>
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('refund')}
                  className="hover:text-amber-300 text-white/90 hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-400">›</span>
                  <span>Return & Refund</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('faq')}
                  className="hover:text-amber-300 text-white/90 hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-400">›</span>
                  <span>FAQ</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('contact')}
                  className="hover:text-amber-300 text-white/90 hover:translate-x-1 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-400">›</span>
                  <span>Contact</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Social Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {t('footer.contact_title', 'যোগাযোগ ও সোশ্যাল মিডিয়া')}
            </h4>
            <ul className="space-y-2.5 text-xs text-white/90 font-medium">
              <li>
                <a 
                  href="https://facebook.com/surokkha.store" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 text-white transition flex items-center gap-2.5 group"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] flex items-center justify-center shrink-0 group-hover:bg-[#1877F2] group-hover:text-white transition-all">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </span>
                  <span>facebook.com/surokkha.store</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com/surokkha.store" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 text-white transition flex items-center gap-2.5 group"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#E4405F]/20 border border-[#E4405F]/40 text-[#E4405F] flex items-center justify-center shrink-0 group-hover:bg-[#E4405F] group-hover:text-white transition-all">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </span>
                  <span>instagram.com/surokkha.store</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@surokkha.store" 
                  className="hover:text-amber-300 text-white transition flex items-center gap-2.5 group"
                >
                  <span className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </span>
                  <span>support@surokkha.store</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/8801600905774" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 text-white transition flex items-center gap-2.5 group"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-all">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                  <span>WhatsApp: 01600-905774</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+8801600905774" 
                  className="hover:text-amber-300 text-white transition flex items-center gap-2.5 group"
                >
                  <span className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-all">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </span>
                  <span>Phone: 01600-905774</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Guarantees */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {t('footer.guarantee_title')}
            </h4>
            <div className="space-y-2 text-xs text-white/90">
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> 
                <span className="text-white">{t('footer.g1')}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> 
                <span className="text-white">{t('footer.g2')}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> 
                <span className="text-white">{t('footer.g3')}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span> 
                <span className="text-white">{t('footer.g4')}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Pure White Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white gap-4">
          <p className="font-medium text-white text-center sm:text-left">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-white">
            <button onClick={() => navigateTo('shop')} className="hover:text-amber-300 transition cursor-pointer text-white">
              {isBn ? 'শপ' : 'Shop'}
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('combo')} className="hover:text-amber-300 transition cursor-pointer text-white">
              {isBn ? 'কম্বো অফার' : 'Offers'}
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('contact')} className="hover:text-amber-300 transition cursor-pointer text-white">
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
