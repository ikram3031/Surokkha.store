const MESSAGES = [
  'Cash on delivery available. Free delivery on orders above ৳1,000.',
  '20% off combo packs — use code COMBO20 at checkout.',
]

export function AnnouncementBar() {
  return (
    <div className="overflow-hidden bg-secondary text-secondary-foreground">
      <div className="animate-marquee flex w-max shrink-0 py-2 motion-reduce:animate-none motion-reduce:justify-center">
        {[0, 1].map((i) => (
          <p
            key={i}
            aria-hidden={i === 1}
            className="flex shrink-0 items-center px-4 text-sm whitespace-nowrap"
          >
            {MESSAGES.map((m, j) => (
              <span key={j} className="flex items-center">
                {m}
                <span aria-hidden className="mx-6 opacity-60">•</span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  )
}
