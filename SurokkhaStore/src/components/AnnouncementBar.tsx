const MESSAGE = 'ক্যাশ অন ডেলিভারি পাওয়া যাচ্ছে। ১০০০ টাকার বেশি কিনলে ডেলিভারি ফ্রি।'

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
            {MESSAGE}
          </p>
        ))}
      </div>
    </div>
  )
}
