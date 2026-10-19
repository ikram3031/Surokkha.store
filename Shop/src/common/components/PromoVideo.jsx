import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../store/useStore';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.surokkha.store';

export default function PromoVideo() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const { isBn } = useTranslation();
  const navigateTo = useStore((state) => state.navigateTo);

  useEffect(() => {
    const candidateUrl = `${API_BASE_URL}/uploads/assets/promo-video.mp4?v=${Date.now()}`;
    
    fetch(candidateUrl, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          setVideoSrc(candidateUrl);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        setHasError(true);
      });
  }, []);

  if (hasError || !videoSrc) {
    return null;
  }

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-brand-500/40 shadow-2xl group">
        
        {/* Ambient background glow */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative aspect-video w-full max-h-[520px] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            loop
            muted={isMuted}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Center Play/Pause Overlay Button */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play video"
              className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-600/90 hover:bg-brand-500 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-xs cursor-pointer"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}

          {/* Bottom Video Controls & Info Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6 flex items-center justify-between z-20 pointer-events-none">
            <div className="pointer-events-auto">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {isBn ? 'অফিসিয়াল প্রোমো' : 'Official Promo'}
              </span>
              <h3 className="text-sm sm:text-lg font-bold text-white font-heading drop-shadow-md">
                {isBn ? 'MO প্রিমিয়াম কোয়ালিটি অভিজ্ঞতা' : 'Experience MO Premium Quality'}
              </h3>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isMuted ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigateTo('shop')}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-xl transition shadow-lg cursor-pointer"
              >
                {isBn ? 'শপ দেখুন' : 'Explore Shop'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
