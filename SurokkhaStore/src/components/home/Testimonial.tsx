import { useEffect, useState } from 'react'
import { testimonials } from '@/data/testimonials'

const ROTATE_MS = 7000

/** One customer quote at a time with dot navigation. Renders nothing until data/testimonials.ts has entries. */
export function Testimonial() {
  const [active, setActive] = useState(0)
  const count = testimonials.length

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((a) => (a + 1) % count), ROTATE_MS)
    return () => clearInterval(id)
  }, [count])

  if (count === 0) return null
  const item = testimonials[active]

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p key={active} className="animate-in fade-in font-display text-xl leading-relaxed duration-500 md:text-2xl">
          “{item.quote}”
        </p>
        <p className="mt-6 text-sm font-semibold">{item.author}</p>
        {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}

        {count > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.quote}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show review ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
