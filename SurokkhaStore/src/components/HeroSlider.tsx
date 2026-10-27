import { Fragment, useEffect, useRef, useState } from 'react'
import { resolveMediaUrl } from '@/lib/api/client'
import { navigate, productPath } from '@/lib/router'

// Ported from SurokkhaShop's HeroBannerSlider (Trial Pack, Ultimate 3-in-1, Protection Combo banners).
interface HeroSlide {
  key: string
  badge: string
  title: { text: string; color: string }[]
  tagline: string[]
  subtitle: string
  chips: { label: string; dot: string }[]
  image: string
  imageAlt: string
  /** Packet cut-out art renders bare; product photos get the rounded card frame. */
  framed: boolean
  ctaNote: string
  /** Product page the slide's CTA opens (slugs as served by the StoreWeb API). */
  slug: string
}

const SLIDES: HeroSlide[] = [
  {
    key: 'trial-pack',
    slug: 'mo-trial-pack-6-pcs',
    badge: 'Trial Combo Pack',
    title: [
      { text: 'MO ', color: 'text-[#4a0f1f]' },
      { text: 'Trial ', color: 'text-[#b0213f]' },
      { text: 'Pack', color: 'text-[#e05578]' },
    ],
    tagline: ['Try', 'Compare', 'Choose Yours'],
    subtitle: 'একসাথে ট্রাই করুন, নিজের জন্য সঠিকটা বেছে নিন',
    chips: [
      { label: '২ পিস আল্ট্রা থিন', dot: 'bg-sky-500' },
      { label: '২ পিস ডটেড', dot: 'bg-pink-500' },
      { label: '২ পিস রিবড', dot: 'bg-slate-300 ring-1 ring-slate-400/60' },
    ],
    image: '/banners/trial-pack-packets.webp',
    imageAlt: 'MO Trial Pack — Ultra Thin, Dotted and Ribbed',
    framed: false,
    ctaNote: 'মোট ৬ পিস — ৩ ধরনের, প্রতিটা ২ পিস করে',
  },
  {
    key: 'ultimate-combo',
    slug: 'mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo',
    badge: 'Best Value Combo',
    title: [
      { text: 'Ultimate ', color: 'text-[#4a0f1f]' },
      { text: '3-in-1', color: 'text-[#b0213f] whitespace-nowrap' },
    ],
    tagline: ['Ultra Thin', 'Dotted', 'Ribbed'],
    subtitle: 'তিন ধরনের ৩টি পূর্ণ বক্স — সব একসাথে এক প্যাকেজে',
    chips: [
      { label: '১০ পিস আল্ট্রা থিন', dot: 'bg-sky-400' },
      { label: '১০ পিস ডটেড', dot: 'bg-pink-400' },
      { label: '১০ পিস রিবড', dot: 'bg-slate-400' },
    ],
    image: resolveMediaUrl('/uploads/2610/261025/mo-ultimate-3-in-1-latex-contraceptive-30-pcs-combo_main_1792933776798.webp')!,
    imageAlt: 'MO Ultimate 3-in-1 Combo — Ultra Thin, Dotted and Ribbed',
    framed: true,
    ctaNote: 'মোট ৩০ পিস — ৩ ধরনের, প্রতিটা ১০ পিস করে',
  },
  {
    key: 'protection-combo',
    slug: 'protection-combo-20-pcs-50gm-gel',
    badge: 'Protection Combo',
    title: [
      { text: 'Protection ', color: 'text-[#4a0f1f]' },
      { text: 'Combo', color: 'text-[#b0213f]' },
    ],
    tagline: ['20 Pcs', '50gm Gel', 'One Pack'],
    subtitle: '২০ পিস কনডম আর ৫০ গ্রাম জেল — সব একসাথে এক প্যাকেজে',
    chips: [
      { label: '২০ পিস কনডম', dot: 'bg-sky-400' },
      { label: '৫০ গ্রাম জেল', dot: 'bg-pink-400' },
    ],
    image: resolveMediaUrl('/uploads/2610/261018/product_protection_combo_20pcs_50g.webp')!,
    imageAlt: 'Protection Combo — 20 pcs condoms and 50gm gel',
    framed: true,
    ctaNote: '২০ পিস কনডম + ৫০ গ্রাম জেল, একসাথে এক প্যাকেজে',
  },
]

const SPEED_MS = 5000
const TRANSITION_MS = 700
const SWIPE_THRESHOLD_PX = 50

function Slide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative flex w-full select-none flex-col justify-center overflow-hidden border-b border-rose-100 bg-gradient-to-br from-[#fdf8f6] via-[#faf0ea] to-[#f6dfe3]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-rose-200/40 blur-3xl" />
        <div className="absolute -bottom-32 left-[-8rem] h-[30rem] w-[30rem] rounded-full bg-pink-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-y-5 px-4 pb-12 pt-8 md:grid-cols-2 md:grid-rows-[auto_auto] md:gap-x-10 md:gap-y-8 md:py-10 lg:py-14">
        <div className="text-center md:col-start-1 md:row-start-1 md:self-end md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b0213f] shadow-xs md:px-5 md:py-2 md:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e05578]" />
            {slide.badge}
          </span>

          <h2 className="mt-4 text-[2.5rem] font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:mt-5 lg:text-7xl">
            {slide.title.map((part) => (
              <span key={part.text} className={part.color}>
                {part.text}
              </span>
            ))}
          </h2>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#3d0c18] sm:text-sm md:mt-6 md:justify-start md:gap-3 md:tracking-[0.3em]">
            {slide.tagline.map((word, i) => (
              <Fragment key={word}>
                {i > 0 && <span className="h-1.5 w-1.5 rounded-full bg-[#e05578]" />}
                <span>{word}</span>
              </Fragment>
            ))}
          </p>

          <p className="mt-2 text-base font-semibold text-[#5a2a35] sm:text-lg md:mt-3 lg:text-xl">
            {slide.subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:mt-6 md:justify-start md:gap-2.5">
            {slide.chips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs md:px-3.5 md:py-1.5 lg:text-sm"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${chip.dot}`} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center md:col-start-2 md:row-span-2 md:row-start-1">
          <img
            src={slide.image}
            alt={slide.imageAlt}
            onClick={() => navigate(productPath(slide.slug))}
            className={
              slide.framed
                ? 'aspect-square w-full max-w-[340px] cursor-pointer rounded-3xl object-cover shadow-2xl ring-4 shadow-rose-900/20 ring-rose-200/70 md:max-w-[460px]'
                : 'h-auto w-full max-w-[420px] cursor-pointer md:max-w-[560px]'
            }
            loading="eager"
            draggable={false}
          />
        </div>

        <div className="text-center md:col-start-1 md:row-start-2 md:self-start md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-5">
            <button
              type="button"
              onClick={() => navigate(productPath(slide.slug))}
              className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-gradient-to-r from-[#5a1426] to-[#a51d3a] py-2 pl-2 pr-8 text-white shadow-xl shadow-rose-900/20 transition hover:from-[#6b1830] hover:to-[#be2446] active:scale-95"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 md:h-11 md:w-11">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="18" cy="20" r="1.4" />
                  <path d="M2.5 3.5h2.7l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.1" />
                </svg>
              </span>
              <span className="text-lg font-extrabold lg:text-xl">অর্ডার করুন</span>
            </button>
            <div className="text-sm font-semibold leading-snug text-[#5a2a35]">{slide.ctaNote}</div>
          </div>
          <p className="mt-4 text-xs text-slate-500 md:mt-6">শুধুমাত্র প্রাপ্তবয়স্কদের জন্য (১৮+)</p>
        </div>
      </div>
    </div>
  )
}

export function HeroSlider() {
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const count = SLIDES.length

  useEffect(() => {
    if (count <= 1 || isPaused) return
    const id = setInterval(() => setActive((a) => (a + 1) % count), SPEED_MS)
    return () => clearInterval(id)
  }, [count, isPaused])

  const goTo = (index: number) => setActive((index + count) % count)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsPaused(true)
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current
    touchStartX.current = null
    setIsPaused(false)
    if (startX == null) return
    const deltaX = e.changedTouches[0].clientX - startX
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return
    goTo(deltaX < 0 ? active + 1 : active - 1)
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex ease-out"
        style={{ transform: `translateX(-${active * 100}%)`, transitionProperty: 'transform', transitionDuration: `${TRANSITION_MS}ms` }}
      >
        {SLIDES.map((slide, i) => (
          <div key={slide.key} className="flex w-full flex-shrink-0" inert={active !== i}>
            <Slide slide={slide} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(active - 1)}
        aria-label="আগের স্লাইড"
        className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-2xl text-[#5a1426] shadow-md transition hover:bg-white 2xl:flex"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => goTo(active + 1)}
        aria-label="পরের স্লাইড"
        className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 text-2xl text-[#5a1426] shadow-md transition hover:bg-white 2xl:flex"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`স্লাইড ${i + 1}`}
            className={`h-2.5 cursor-pointer rounded-full transition-all ${i === active ? 'w-7 bg-[#e05578]' : 'w-2.5 bg-slate-400/60 hover:bg-slate-400'}`}
          />
        ))}
      </div>
    </section>
  )
}
