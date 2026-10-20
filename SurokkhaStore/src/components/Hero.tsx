import { Button } from '@/components/ui/button'
import { BoxIcon, BottleIcon } from '@/components/icons/ArtIcons'

export function Hero() {
  return (
    <section className="overflow-hidden bg-secondary">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.25] text-foreground sm:text-5xl sm:leading-[1.25]">
            নিরাপদ ভালোবাসা,
            <br />
            নিঃসংকোচে
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            কনডম ও লুব্রিকেন্ট অর্ডার করুন ঘরে বসেই। বাইরে থেকে বোঝা যাবে না এমন সাদামাটা
            প্যাকেটে পৌঁছে যাবে আপনার দরজায়।
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <a href="#shop">কেনাকাটা শুরু করুন</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7">
              <a href="#faq">প্রশ্নোত্তর দেখুন</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            বিকাশ, নগদ ও ক্যাশ অন ডেলিভারিতে পেমেন্ট করা যায়।
          </p>
        </div>

        {/* Heart motif from the logo */}
        <div className="relative mx-auto aspect-[200/190] w-full max-w-md">
          <svg viewBox="0 0 200 190" className="heartbeat absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F7A3B1" />
                <stop offset="1" stopColor="#F08C9E" />
              </linearGradient>
            </defs>
            <path
              d="M100 172 C42 130 14 96 14 64 C14 38 33 22 54 22 C73 22 90 33 100 50 C110 33 127 22 146 22 C167 22 186 38 186 64 C186 96 158 130 100 172Z"
              fill="var(--background)"
              stroke="url(#heartGrad)"
              strokeWidth={20}
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center gap-1 pb-4">
            <div className="h-28 w-28 sm:h-36 sm:w-36">
              <BoxIcon c1="#F4919F" c2="#C9475F" />
            </div>
            <div className="-ml-4 mt-6 h-28 w-28 sm:h-36 sm:w-36">
              <BottleIcon c1="#F5E6D3" c2="#948B86" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
