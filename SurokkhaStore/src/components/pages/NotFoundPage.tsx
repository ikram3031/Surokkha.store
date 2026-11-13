import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { navigate } from '@/lib/router'

/** Shown for any URL the store has no page for. */
export function NotFoundPage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Page not found | Surokkha Store'
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
      <h1 className="mt-4 font-display text-2xl font-bold md:text-3xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        The page you're looking for has moved or the link is wrong. Head back home or browse our products.
      </p>
      <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
          Back to home
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/offers')}>
          See offers
        </Button>
      </div>
      <button
        onClick={() => navigate('/faq')}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
      >
        Need help? Read the FAQ
      </button>
    </div>
  )
}
