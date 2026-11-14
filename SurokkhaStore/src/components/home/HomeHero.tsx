import { Button } from '@/components/ui/button'
import { L } from '@/lib/i18n'

// Scrolls to the first product section right under the hero
const scrollToProducts = () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })

// Home hero: one simple offer banner, products start right after it
export const HomeHero = () => (
  <section className="relative overflow-hidden bg-primary text-primary-foreground">
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-10 text-center md:py-14">
      <p className="text-sm font-semibold tracking-wide opacity-90 md:text-base">⚡ {L('November Flash Sale', 'নভেম্বর ফ্ল্যাশ সেল')}</p>
      <h1 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
        {L('Up to 30% off', '৩০% পর্যন্ত ছাড়')}
      </h1>
      <p className="mt-3 text-sm opacity-90 md:text-base">
        {L('Free delivery on orders over ৳1,000', '১০০০ টাকার উপরে অর্ডারে ফ্রি ডেলিভারি')}
      </p>
      <Button size="lg" variant="secondary" className="mt-6 h-11 rounded-full px-8 text-base font-semibold" onClick={scrollToProducts}>
        {L('Shop now', 'এখনই কিনুন')}
      </Button>
    </div>
  </section>
)
