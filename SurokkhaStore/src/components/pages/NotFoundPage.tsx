import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { navigate } from '@/lib/router'
import { L } from '@/lib/i18n'

/** Shown for any URL the store has no page for. */
export function NotFoundPage() {
  useEffect(() => {
    const prev = document.title
    document.title = L('Page not found | Surokkha Store', 'পেজটি পাওয়া যায়নি | সুরক্ষা স্টোর')
    // Keep search engines from indexing dead URLs
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.appendChild(robots)
    return () => {
      document.title = prev
      robots.remove()
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-8xl font-bold tracking-tight text-primary md:text-9xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold md:text-3xl">{L('Page not found', 'পেজটি পাওয়া যায়নি')}</h1>
      <p className="mt-3 text-muted-foreground">
        {L('The page you\'re looking for has moved or the link is wrong. Head back home or browse our products.', 'আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে বা লিংকটি ভুল। হোমে ফিরে যান বা আমাদের প্রোডাক্ট দেখুন।')}
      </p>
      <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
          {L('Back to home', 'হোমে ফিরে যান')}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/offers')}>
          {L('See offers', 'অফার দেখুন')}
        </Button>
      </div>
      <button
        onClick={() => navigate('/faq')}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
      >
        {L('Need help? Read the FAQ', 'সাহায্য দরকার? সাধারণ জিজ্ঞাসা পড়ুন')}
      </button>
    </div>
  )
}
