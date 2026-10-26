import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { testimonials } from '../data/testimonials';

export default function TestimonialCarousel({ theme = 'light' }) {
  const { t, isBn } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const autoPlayRef = useRef(null);

  const totalItems = testimonials.length;

  // Responsive items per view: mobile: 1, tablet: 2, desktop: 3
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, totalItems - visibleCount);

  // Auto slide interval
  useEffect(() => {
    if (!isAutoPlaying) return;
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, maxIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const isDark = theme === 'dark';

  return (
    <section 
      id="testimonialsSection" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 select-none"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-5">
        <span className={`text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full border inline-flex items-center gap-1.5 shadow-2xs ${
          isDark 
            ? 'bg-slate-900 border-brand-500/40 text-amber-400' 
            : 'bg-rose-50 border-rose-200/70 text-brand-800'
        }`}>
          <span>💬</span>
          <span>{t('testimonials.badge', 'গ্রাহক প্রতিক্রিয়া ও রিভিউ')}</span>
        </span>
        <h2 className={`text-2xl sm:text-3xl font-heading font-bold mt-2.5 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {t('testimonials.title', 'আমাদের সম্মানিত গ্রাহকদের মতামত')}
        </h2>
        <p className={`text-xs sm:text-sm mt-1 max-w-lg mx-auto leading-relaxed ${
          isDark ? 'text-slate-300' : 'text-slate-800'
        }`}>
          {t('testimonials.subtitle', 'সারা বাংলাদেশ থেকে সংগৃহীত প্রকৃত ক্রেতাদের বিশ্বস্ত ও গোপনীয় অভিজ্ঞতার গল্প।')}
        </p>
      </div>

      {/* Aggregate Rating & Trust Metrics Bar */}
      <div className={`border rounded-2xl p-3 sm:p-3.5 mb-5 sm:mb-6 shadow-xs max-w-4xl mx-auto flex flex-wrap items-center justify-around gap-3 sm:gap-4 text-center ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
          : 'bg-white border-slate-200/80 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex text-amber-400 text-base">
            {'★★★★★'.split('').map((star, i) => (
              <span key={i} className="drop-shadow-2xs">{star}</span>
            ))}
          </div>
          <span className={`text-xs sm:text-sm font-extrabold font-heading ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {isBn ? '৪.৯ / ৫.০' : '4.9 / 5.0'}
          </span>
          <span className="text-xs text-slate-800 font-semibold">
            ({isBn ? '১২৫০+ রিভিউ' : '1,250+ Reviews'})
          </span>
        </div>

        <div className={`hidden sm:block w-px h-6 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-emerald-400">✓</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
            {isBn ? '১০০% ভেরিফায়েড পার্সেল' : '100% Verified Delivery'}
          </span>
        </div>

        <div className={`hidden md:block w-px h-6 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-rose-400">🔒</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>
            {isBn ? '১০০% গোপনীয় আনলেবেলড মোড়ক' : '100% Confidential Packaging'}
          </span>
        </div>
      </div>

      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding Card Window */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
          }}
        >
          {testimonials.map((item) => {
            const reviewerName = isBn ? item.name_bn : item.name;
            const reviewerLocation = isBn ? item.location_bn : item.location;
            const productName = isBn ? item.productName_bn : item.productName;
            const comment = isBn ? item.comment_bn : item.comment;
            const hasImgError = imageErrors[item.id];

            return (
              <div 
                key={item.id} 
                className="px-2.5 sm:px-3 flex-shrink-0"
                style={{ width: `${100 / visibleCount}%` }}
              >
                <div className={`h-full border rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group ${
                  isDark 
                    ? 'bg-slate-900/90 border-slate-800 hover:border-brand-500/50' 
                    : 'bg-white border-slate-200/90 hover:border-rose-300'
                }`}>
                  
                  {/* Decorative Quote Icon Background */}
                  <div className={`absolute top-5 right-6 transition-colors pointer-events-none ${
                    isDark ? 'text-slate-800 group-hover:text-slate-700/60' : 'text-rose-100 group-hover:text-rose-200/70'
                  }`}>
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  <div>
                    {/* Rating Stars & Purchased Product Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                      <div className="flex text-amber-400 text-sm">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>

                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isDark 
                          ? 'bg-slate-800 text-amber-300 border-slate-700' 
                          : 'text-brand-800 bg-rose-50/90 border-rose-200/60'
                      }`}>
                        {productName}
                      </span>
                    </div>

                    {/* Review Quote Body */}
                    <p className={`text-xs sm:text-sm leading-relaxed font-normal italic relative z-10 mb-6 ${
                      isDark ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      “{comment}”
                    </p>
                  </div>

                  {/* Reviewer Profile & Verified Badge */}
                  <div className={`pt-4 border-t flex items-center gap-3 ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="relative flex-shrink-0">
                      {!hasImgError ? (
                        <img 
                          src={item.avatar} 
                          alt={reviewerName} 
                          onError={(e) => {
                            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                            handleImageError(item.id);
                          }}
                          className={`w-11 h-11 rounded-full object-cover border-2 shadow-2xs ${
                            isDark ? 'border-slate-700' : 'border-rose-100'
                          }`}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-500 to-brand-800 text-white font-bold flex items-center justify-center text-sm shadow-2xs border-2 border-rose-100">
                          {getInitials(reviewerName)}
                        </div>
                      )}
                      
                      {/* Mini Verified Checkmark Icon */}
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 ring-2 ring-white text-[9px]" title={t('testimonials.verified_buyer', 'Verified Buyer')}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </div>

                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`text-xs sm:text-sm font-bold truncate ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {reviewerName}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 flex-shrink-0">
                          {t('testimonials.verified_buyer', 'ভেরিফায়েড')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-medium truncate">
                        {reviewerLocation}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Navigation Controls & Dots */}
      <div className="flex items-center justify-between mt-8 max-w-4xl mx-auto px-2">
        {/* Prev Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label={t('testimonials.prev', 'Previous Reviews')}
          className={`w-10 h-10 rounded-full border shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
            isDark 
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600' 
              : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-brand-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Indicator Pagination Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentIndex === idx 
                  ? (isDark ? 'w-7 h-2.5 bg-amber-400' : 'w-7 h-2.5 bg-brand-800')
                  : (isDark ? 'w-2.5 h-2.5 bg-slate-700 hover:bg-slate-600' : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400')
              }`}
            />
          ))}
        </div>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={handleNext}
          aria-label={t('testimonials.next', 'Next Reviews')}
          className={`w-10 h-10 rounded-full border shadow-2xs transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
            isDark 
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600' 
              : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-brand-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
