import React, { useEffect, useRef, useState } from 'react';
import TrialPackHero from './TrialPackHero';
import UltimateComboHero from './UltimateComboHero';

const AUTOPLAY_MS = 5000;

// Hero banner slides. Each one is a coded banner (image as the visual, text/button/link in code),
// so links, button effects and text can be changed without re-making an image.
// Slides sit side by side in a flex row, so every slide takes the height of the tallest one.
const SLIDES = [
  { key: 'trial-pack', Component: TrialPackHero },
  { key: 'ultimate-combo', Component: UltimateComboHero },
];

const SWIPE_THRESHOLD_PX = 50;

export default function HeroBannerSlider() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideCount = SLIDES.length;
  const current = active % slideCount;

  useEffect(() => {
    if (slideCount <= 1 || isPaused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slideCount), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [slideCount, isPaused]);

  const goTo = (index) => setActive((index + slideCount) % slideCount);

  // Touch swipe for phones
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const handleTouchEnd = (e) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);
    if (startX == null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goTo(deltaX < 0 ? current + 1 : current - 1);
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map(({ key, Component }, i) => (
          <div key={key} className="w-full flex-shrink-0 flex" inert={current !== i}>
            <Component />
          </div>
        ))}
      </div>

      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="hidden 2xl:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-[#5a1426] shadow-md items-center justify-center text-2xl cursor-pointer transition"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="Next slide"
            className="hidden 2xl:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white text-[#5a1426] shadow-md items-center justify-center text-2xl cursor-pointer transition"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {SLIDES.map(({ key }, i) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${i === current ? 'w-7 bg-[#e05578]' : 'w-2.5 bg-slate-400/60 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
