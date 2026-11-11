import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Milliseconds between automatic moves */
  interval?: number
  /** Tailwind width classes for each slide (how many show at once per breakpoint) */
  slideClassName?: string
}

/**
 * Swipeable, auto-moving row with dots and no arrows. Uses native scroll snapping, so touch swipe
 * works on phones; autoplay pauses while the visitor is touching or hovering it.
 */
export function AutoCarousel({
  children,
  interval = 3500,
  slideClassName = 'basis-[calc((100%-0.75rem)/2)] sm:basis-[calc((100%-2.5rem)/3)] lg:basis-[calc((100%-3.75rem)/4)]',
}: Props) {
  const slides = Children.toArray(children)
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [pages, setPages] = useState(1)
  const paused = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // How far one slide moves, and how many start positions there are (slides minus the ones already in view)
  const measure = useCallback(() => {
    const track = trackRef.current
    const first = track?.children[0] as HTMLElement | undefined
    if (!track || !first) return { step: 1, count: 1 }
    const second = track.children[1] as HTMLElement | undefined
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth
    const perView = Math.max(1, Math.round(track.clientWidth / step))
    return { step, count: Math.max(1, slides.length - perView + 1) }
  }, [slides.length])

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current
      if (!track) return
      const { step } = measure()
      track.scrollTo({ left: i * step, behavior: 'smooth' })
    },
    [measure],
  )

  useEffect(() => {
    const update = () => setPages(measure().count)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [measure])

  useEffect(() => {
    if (pages <= 1) return
    const id = setInterval(() => {
      if (paused.current || document.hidden) return
      goTo((active + 1) % pages)
    }, interval)
    return () => clearInterval(id)
  }, [active, pages, interval, goTo])

  const pause = () => {
    paused.current = true
    clearTimeout(resumeTimer.current)
  }
  // After a swipe, give the visitor a moment before moving again
  const resumeLater = () => {
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => (paused.current = false), interval)
  }
  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={(e) => {
          const { step, count } = measure()
          setActive(Math.min(count - 1, Math.round(e.currentTarget.scrollLeft / step)))        }}
        // Mouse only: on Android a touch swipe fires pointercancel/pointerleave at its start
        onPointerEnter={(e) => e.pointerType === 'mouse' && pause()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && resumeLater()}
        onTouchStart={pause}
        onTouchEnd={resumeLater}
        onTouchCancel={resumeLater}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-1 [scrollbar-width:none] [touch-action:pan-x_pan-y] sm:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div key={i} className={`flex shrink-0 grow-0 snap-start ${slideClassName}`}>
            <div className="w-full [&>article]:h-full">{slide}</div>
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                goTo(i)
                pause()
                resumeLater()
              }}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
