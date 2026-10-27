import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAccessToken } from '@/lib/api/client'
import { login, logout } from '@/lib/api/auth'
import { navigate } from '@/lib/router'

export function AccountPage() {
  const [loggedIn, setLoggedIn] = useState(() => !!getAccessToken())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await login({ email: email.trim(), password })
      setLoggedIn(true)
      setPassword('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not log in.')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    await logout().catch(() => {})
    setLoggedIn(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-2xl font-bold">{loggedIn ? 'My Account' : 'Log in'}</h1>

      {loggedIn ? (
        <div className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6">
          <p className="text-muted-foreground">You're logged in.</p>
          <div className="flex gap-3">
            <Button className="rounded-full" onClick={() => navigate('/')}>
              Continue shopping
            </Button>
            <Button variant="outline" className="rounded-full" onClick={signOut}>
              Log out
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Password</span>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={busy}>
            {busy ? 'Please wait...' : 'Log in'}
          </Button>
        </form>
      )}
    </div>
  )
}
