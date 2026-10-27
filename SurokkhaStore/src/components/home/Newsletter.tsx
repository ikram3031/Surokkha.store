import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribe } from '@/lib/api/contact'
import { isValidEmail } from '@/lib/checkout'

/** Email signup card on a soft band, just above the footer. */
export function Newsletter() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!isValidEmail(email)) return toast.error('Please enter a valid email address')
    setBusy(true)
    try {
      await subscribe(email.trim().toLowerCase())
      setDone(true)
      setEmail('')
      toast.success('You are subscribed. Welcome!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not subscribe. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-secondary py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid items-center gap-8 rounded-2xl bg-card px-6 py-10 shadow-xs md:grid-cols-2 md:px-14 md:py-14">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">Get health tips and offers by email</h2>
            <p className="mt-2 text-sm text-muted-foreground">No spam, just the useful stuff.</p>
          </div>

          <form onSubmit={submit} noValidate>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex overflow-hidden rounded-full border border-border bg-background focus-within:border-primary">
              <Input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                autoComplete="email"
                className="h-12 flex-1 border-0 bg-transparent px-5 shadow-none"
              />
              <Button type="submit" className="h-12 rounded-none px-6" disabled={busy || done}>
                {done ? 'Subscribed' : busy ? '...' : 'Subscribe'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
