const MESSAGES = [
  'Cash on delivery available. Free delivery on orders above ৳1,000.',
  '20% off combo packs — use code COMBO20 at checkout.',
]

/* Each half of the track repeats the messages enough to be wider than any
   screen, so the -50% loop never shows an empty gap. */
const REPEAT = 4

export function AnnouncementBar() {
  return (
    <div className="group overflow-hidden border-b border-border bg-wine text-text-secondary [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="animate-marquee flex w-max py-2 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((i) => (
          <p key={i} aria-hidden={i === 1} className="flex shrink-0 items-center text-[13px] tracking-wide whitespace-nowrap">
            {Array.from({ length: REPEAT }).flatMap((_, r) =>
              MESSAGES.map((m, j) => (
                <span key={`${r}-${j}`} aria-hidden={r > 0 || undefined} className="flex items-center">
                  {m}
                  <span aria-hidden className="mx-8 size-1 rounded-full bg-primary" />
                </span>
              )),
            )}
          </p>
        ))}
      </div>
    </div>
  )
}
