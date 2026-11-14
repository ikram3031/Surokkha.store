import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { subscribe } from '@/lib/api/contact'
import { isValidEmail } from '@/lib/checkout'
import { L } from '@/lib/i18n'

/** Email signup card on the page background, just above the footer. */
export function Newsletter() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!isValidEmail(email)) return toast.error(L('Please enter a valid email address', 'অনুগ্রহ করে একটি সঠিক ইমেইল লিখুন'))
    setBusy(true)
    try {
      await subscribe(email.trim().toLowerCase())
      setDone(true)
      setEmail('')
      toast.success(L('You are subscribed. Welcome!', 'সাবস্ক্রাইব সম্পন্ন হয়েছে। স্বাগতম!'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : L('Could not subscribe. Please try again.', 'সাবস্ক্রাইব করা যায়নি। আবার চেষ্টা করুন।'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="dark relative grid items-center gap-8 overflow-hidden rounded-2xl bg-header px-6 py-10 text-foreground md:grid-cols-2 md:px-14 md:py-14">
          <img src="/banners/blog-hero.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold leading-tight">{L('Get health tips and offers by email', 'ইমেইলে স্বাস্থ্য টিপস ও অফার পান')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{L('No spam, just the useful stuff.', 'কোনো স্প্যাম নয়, শুধু দরকারি তথ্য।')}</p>
          </div>

          <form onSubmit={submit} noValidate className="relative">
            <label htmlFor="newsletter-email" className="sr-only">
              {L('Email address', 'ইমেইল ঠিকানা')}
            </label>
            <div className="flex overflow-hidden rounded-full bg-white">
              <Input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={L('Your email address', 'আপনার ইমেইল ঠিকানা')}
                autoComplete="email"
                className="h-12 flex-1 border-0 !bg-transparent px-5 text-[#1f1a1c] shadow-none placeholder:text-[#8a7b7f]"
              />
              <Button type="submit" className="h-12 rounded-none px-6" disabled={busy || done}>
                {done ? L('Subscribed', 'সাবস্ক্রাইবড') : busy ? '...' : L('Subscribe', 'সাবস্ক্রাইব')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
