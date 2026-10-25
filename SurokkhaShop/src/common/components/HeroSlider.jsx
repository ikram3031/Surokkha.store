import React, { useState, useEffect, useRef } from 'react';
import { useStore, getFeaturedCombo } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

// Hero banner video and showcase slider component
const HeroSlider = () => {
  const [videoError, setVideoError] = useState(false);
  const [mobileVideoFailed, setMobileVideoFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  const videoRef = useRef(null);

  const navigateTo = useStore((state) => state.navigateTo);
  const navigateToCombo = useStore((state) => state.navigateToCombo);
  const openProduct = useStore((state) => state.openProduct);
  const products = useStore((state) => state.products);
  const { t, isBn, formatPrice } = useTranslation();

  // Hero combo offer shows the site-wide featured combo (Ultimate 3-in-1 30 pcs)
  const combo30Prod = getFeaturedCombo(products);

  const comboKey = combo30Prod?.slug || combo30Prod?.id || 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo';
  const comboPrice = combo30Prod ? (combo30Prod.offerPrice || combo30Prod.price) : null;

  // Open the pinned combo product when available, otherwise fall back to the combo view.
  const handleComboCta = () => {
    if (combo30Prod) {
      openProduct(comboKey);
    } else {
      navigateToCombo();
    }
  };

  const videoUrl = `${API_BASE_URL}/uploads/assets/promo-video.mp4`;
  const mobileVideoUrl = `${API_BASE_URL}/uploads/assets/promo-video-mobile.mp4`;
  const useMobileVideo = isMobile && !mobileVideoFailed;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
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
      'bg-gradient-to-br from-[#200b14] via-[#12060b] to-[#200b14] text-white border-b border-rose-950/80'
    } select-none min-h-[calc(100vh-90px)] sm:min-h-[calc(100vh-96px)] flex flex-col justify-center`}>
      <div className="relative w-full overflow-hidden flex-1 flex flex-col justify-center">
        
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {!videoError && (
            <video
              ref={videoRef}
              src={useMobileVideo ? mobileVideoUrl : videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => (useMobileVideo ? setMobileVideoFailed(true) : setVideoError(true))}
              className={`w-full h-full object-cover object-center scale-105 opacity-85 transition-opacity duration-1000`}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#12060b]/90 via-black/40 to-black/25 z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-rose-600/15 blur-3xl pointer-events-none z-10" />
          <div className="absolute -bottom-10 right-10 w-60 h-60 bg-amber-500/10 blur-3xl pointer-events-none z-10" />
        </div>

        <div className="relative z-20 px-4 sm:px-8 md:px-12 py-16 sm:py-24 md:py-28 text-center max-w-4xl mx-auto flex flex-col items-center justify-center flex-1">
          
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide uppercase mb-4 backdrop-blur-md shadow-md ${
            'bg-black/60 border border-white/30 text-white'
          }`}>
            <span>{t('hero.top_badge', '১৮+ সার্টিফাইড স্বাস্থ্য ও পরিবার পরিকল্পনা সামগ্রী')}</span>
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl lg:text-[44px] font-heading font-extrabold tracking-tight leading-snug md:leading-tight mb-4 max-w-3xl ${
            'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]'
          }`}>
            {t('hero.title', 'প্রিমিয়াম কোয়ালিটি, ১০০% ডিসক্রিট প্যাকেজিং')}
          </h1>

          <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 ${
            'text-white/95 font-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]'
          }`}>
            {isBn ? (
              <>
                সেরা ৩টি ভ্যারিয়েন্টের ৩০ পিস কম্বো প্যাকটি নিন বিশেষ ছাড়ে —{' '}
                <span className={`text-amber-300 font-extrabold underline decoration-rose-500/80 decoration-2 underline-offset-4`}>
                  {comboPrice ? `মাত্র ${formatPrice(comboPrice)}` : 'সেরা সাশ্রয়ী মূল্যে'}
                </span>
              </>
            ) : (
              <>
                Get the exclusive 30-piece combo pack of the top 3 variants at a special discount —{' '}
                <span className={`text-amber-300 font-extrabold underline decoration-rose-500/80 decoration-2 underline-offset-4`}>
                  {comboPrice ? `Only ${formatPrice(comboPrice)}` : 'Special Value Deal'}
                </span>
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none mx-auto">
            <button
              type="button"
              onClick={handleComboCta}
              aria-label={isBn ? (comboPrice ? `🔥 ৩০ পিস কম্বো (${formatPrice(comboPrice)})` : '🔥 ৩০ পিস কম্বো') : (comboPrice ? `🔥 30pcs Combo (${formatPrice(comboPrice)})` : '🔥 30pcs Combo')}
              className="w-full sm:w-64 md:w-72 bg-gradient-to-r from-[#F43F5E] via-[#E11D48] to-[#BE123C] hover:from-[#FB7185] hover:to-[#9F1239] text-white font-bold text-sm sm:text-base px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-2xl hover:shadow-rose-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-rose-400/50 text-center animate-whatsapp-vibrate ring-2 ring-rose-500/40"
            >
              <span>{isBn ? (comboPrice ? `🔥 ৩০ পিস কম্বো (${formatPrice(comboPrice)})` : '🔥 ৩০ পিস কম্বো') : (comboPrice ? `🔥 30pcs Combo (${formatPrice(comboPrice)})` : '🔥 30pcs Combo')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('shop')}
              aria-label={t('hero.shop_btn', 'সকল প্রোডাক্ট')}
              className={`w-full sm:w-64 md:w-72 font-bold text-sm sm:text-base px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center ${
                'bg-black/50 hover:bg-rose-950/40 text-rose-100 hover:text-white border-2 border-rose-500/70 hover:border-rose-400'
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
