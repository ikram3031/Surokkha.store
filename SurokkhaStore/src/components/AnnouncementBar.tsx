// Each message leads with its own icon: an offer emoji for deals, a plain one for general info
const MESSAGES = [
  { icon: '⚡', text: 'নভেম্বর ফ্ল্যাশ সেল চলছে, বেশিরভাগ প্রোডাক্টে ছাড়' },
  { icon: '🚚', text: 'রেজিস্ট্রেশন করলে প্রথম অর্ডারে ফ্রি ডেলিভারি' },
  { icon: '🎁', text: '১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি' },
]

/* Each half of the track repeats the messages enough to be wider than any
   screen, so the -50% loop never shows an empty gap. */
const REPEAT = 4

export function AnnouncementBar() {
  return (
    <div className="group overflow-hidden border-b border-header-bar-foreground/10 bg-header-bar font-medium text-header-bar-foreground [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <div className="animate-marquee flex w-max py-2 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((i) => (
          <p key={i} aria-hidden={i === 1} className="flex shrink-0 items-center text-[13px] tracking-wide whitespace-nowrap">
            {Array.from({ length: REPEAT }).flatMap((_, r) =>
              MESSAGES.map((m, j) => (
                <span key={`${r}-${j}`} aria-hidden={r > 0 || undefined} className="mr-12 flex items-center gap-1">
                  <span aria-hidden className="text-sm leading-none">{m.icon}</span>
                  {m.text}
                </span>
              )),
            )}
          </p>
        ))}
      </div>
    </div>
  )
}
