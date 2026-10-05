import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import { SITE_CONFIG } from '../config/siteConfig';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// Hero banner video and showcase slider component
const HeroSlider = () => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  const navigateTo = useStore((state) => state.navigateTo);
  const navigateToCombo = useStore((state) => state.navigateToCombo);
  const { t, isBn } = useTranslation();

  const isStore = Boolean(SITE_CONFIG.isStore);
  const videoUrl = `${API_BASE_URL}/uploads/assets/promo-video.mp4`;
  const posterUrl = `${API_BASE_URL}/uploads/assets/slider-2.webp`;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  return (
    <section className={`w-full relative overflow-hidden ${
      isStore 
        ? 'bg-[#180812] text-slate-900 border-b border-rose-200/80' 
        : 'bg-gradient-to-br from-[#200b14] via-[#12060b] to-[#200b14] text-white border-b border-rose-950/80'
    } select-none min-h-[calc(100vh-90px)] sm:min-h-[calc(100vh-96px)] flex flex-col justify-center`}>
      <div className="relative w-full overflow-hidden flex-1 flex flex-col justify-center">
        
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {!videoError ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setVideoError(true)}
              className={`w-full h-full object-cover object-center scale-105 ${isStore ? 'opacity-95' : 'opacity-85'} transition-opacity duration-1000`}
            />
          ) : (
            <img
              src={posterUrl}
              alt="Surokkha Premium Collection"
              className={`w-full h-full object-cover object-center scale-105 ${isStore ? 'opacity-90' : 'opacity-75'}`}
            />
          )}

          {isStore ? (
            <>
              {/* Minimal White Translucent Overlay - Maximum Video Clarity */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/12 to-white/25 z-10" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-200/10 blur-3xl pointer-events-none z-10" />
              <div className="absolute -bottom-10 right-10 w-72 h-72 bg-amber-100/10 blur-3xl pointer-events-none z-10" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#12060b]/90 via-black/40 to-black/25 z-10" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-rose-600/15 blur-3xl pointer-events-none z-10" />
              <div className="absolute -bottom-10 right-10 w-60 h-60 bg-amber-500/10 blur-3xl pointer-events-none z-10" />
            </>
          )}
        </div>

        <div className="relative z-20 px-4 sm:px-8 md:px-12 py-16 sm:py-24 md:py-28 text-center max-w-4xl mx-auto flex flex-col items-center justify-center flex-1">
          
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase mb-4 backdrop-blur-md shadow-md ${
            isStore 
              ? 'bg-white/85 border border-rose-300 text-rose-950 shadow-rose-100/50' 
              : 'bg-black/60 border border-white/30 text-white'
          }`}>
            <span>{t('hero.top_badge', '১৮+ সার্টিফাইড স্বাস্থ্য ও পরিবার পরিকল্পনা সামগ্রী')}</span>
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl lg:text-[44px] font-heading font-extrabold tracking-tight leading-snug md:leading-tight mb-4 max-w-3xl ${
            isStore ? 'text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]' : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]'
          }`}>
            {t('hero.title', 'প্রিমিয়াম কোয়ালিটি, ১০০% ডিসক্রিট প্যাকেজিং')}
          </h1>

          <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 ${
            isStore ? 'text-slate-800 font-medium' : 'text-white/95 font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
          }`}>
            {isBn ? (
              <>
                সেরা ৩টি ভ্যারিয়েন্টের ৩০ পিস কম্বো প্যাকটি নিন বিশেষ ছাড়ে —{' '}
                <span className={`${isStore ? 'text-rose-700' : 'text-amber-300'} font-extrabold underline decoration-rose-500/80 decoration-2 underline-offset-4`}>
                  মাত্র ৯০০ টাকায়
                </span>
              </>
            ) : (
              <>
                Get the exclusive 30-piece combo pack of the top 3 variants at a special discount —{' '}
                <span className={`${isStore ? 'text-rose-700' : 'text-amber-300'} font-extrabold underline decoration-rose-500/80 decoration-2 underline-offset-4`}>
                  Only ৳900
                </span>
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={navigateToCombo}
              aria-label={t('hero.offers_btn', '🔥 ৩০ পিস কম্বো অর্ডার করুন (৳৯০০)')}
              className="w-full sm:w-64 md:w-72 bg-gradient-to-r from-[#F43F5E] via-[#E11D48] to-[#BE123C] hover:from-[#FB7185] hover:to-[#9F1239] text-white font-bold text-sm sm:text-base px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-2xl hover:shadow-rose-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-rose-400/50 text-center animate-whatsapp-vibrate ring-2 ring-rose-500/40"
            >
              <span>{t('hero.offers_btn', '🔥 ৩০ পিস কম্বো অর্ডার করুন (৳৯০০)')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop')}
              aria-label={t('hero.shop_btn', 'সকল প্রোডাক্ট')}
              className={`w-full sm:w-64 md:w-72 font-bold text-sm sm:text-base px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center ${
                isStore
                  ? 'bg-white/95 hover:bg-rose-50 text-slate-800 hover:text-rose-950 border-2 border-slate-300 hover:border-rose-400'
                  : 'bg-black/50 hover:bg-rose-950/40 text-rose-100 hover:text-white border-2 border-rose-500/70 hover:border-rose-400'
              }`}
            >
              <span>{t('hero.shop_btn', 'সকল প্রোডাক্ট')}</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
