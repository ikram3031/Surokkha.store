import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSectionBackground } from '@/hooks/useSectionBackground'
import {
  fetchCurrentCustomer,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  type Customer,
} from '@/lib/api/customer-auth'
import { isValidEmail, normalizePhone, toEnDigits } from '@/lib/checkout'
import { navigate } from '@/lib/router'

type View = 'login' | 'signup' | 'forgot' | 'reset' | 'account'

const MIN_PASSWORD = 8

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  autoComplete: string
  placeholder?: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Input
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-11 pr-11"
        required
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function Breadcrumb({ current, onDark = false }: { current: string; onDark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm ${onDark ? 'text-background/80' : 'text-muted-foreground'}`}>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate('/')
        }}
        className={onDark ? 'hover:text-background' : 'hover:text-primary'}
      >
        Home
      </a>
      <span aria-hidden="true">/</span>
      <span className={`font-semibold ${onDark ? 'text-background' : 'text-foreground'}`} aria-current="page">
        {current}
      </span>
    </nav>
  )
}

export function AccountPage() {
  const image = useSectionBackground('login')
  const [view, setView] = useState<View>('login')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchCurrentCustomer().then((c) => {
      if (cancelled) return
      if (c) {
        setCustomer(c)
        setView('account')
      }
      setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const go = (next: View) => {
    setView(next)
    setNotice('')
    setPassword('')
    setCode('')
  }

  const run = async (task: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      await task()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const enter = (c: Customer) => {
    setCustomer(c)
    setPassword('')
    setCode('')
    setNotice('')
    setView('account')
  }

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault()
    run(async () => enter(await login({ email: email.trim(), password })))
  }

  const submitSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return toast.error('Please enter your name')
    if (!isValidEmail(email)) return toast.error('Please enter a valid email address')
    if (password.length < MIN_PASSWORD) return toast.error(`Password must be at least ${MIN_PASSWORD} characters`)
    run(async () =>
      enter(
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() ? normalizePhone(phone) : undefined,
        }),
      ),
    )
  }

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) return toast.error('Please enter a valid email address')
    run(async () => {
      const res = await forgotPassword(email.trim())
      setView('reset')
      setNotice(res.message)
    })
  }

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return toast.error('Enter the 6-digit code from your email')
    if (password.length < MIN_PASSWORD) return toast.error(`Password must be at least ${MIN_PASSWORD} characters`)
    run(async () => {
      enter(await resetPassword({ email: email.trim(), otp: code, password }))
      toast.success('Password updated. You are now logged in.')
    })
  }

  const resendCode = () =>
    run(async () => {
      const res = await forgotPassword(email.trim())
      setNotice(res.message)
    })

  const signOut = () => {
    logout()
    setCustomer(null)
    setView('login')
  }

  const heading: Record<View, { title: string; sub: string }> = {
    login: { title: 'Welcome back', sub: 'Log in to your Surokkha account.' },
    signup: { title: 'Create your account', sub: 'Quick to set up, and your details stay private.' },
    forgot: { title: 'Forgot your password?', sub: "Enter your email and we'll send you a 6-digit code." },
    reset: { title: 'Reset your password', sub: 'Enter the code we emailed you and choose a new password.' },
    account: { title: customer ? `Hello, ${customer.name.split(' ')[0]}` : 'My Account', sub: 'You are logged in.' },
  }

  const crumb: Record<View, string> = {
    login: 'Log in',
    signup: 'Sign up',
    forgot: 'Forgot password',
    reset: 'Reset password',
    account: 'My Account',
  }

  const primary = 'h-11 w-full rounded-full text-base'
  const link = 'font-semibold text-primary underline-offset-4 hover:underline'

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 lg:pt-8">
      <div className="hidden lg:block">
        <Breadcrumb current={crumb[view]} />
      </div>
      {/* One light-tinted card (theme "secondary") on the white page: the image runs edge to edge, no inner padding */}
      <div className="mb-10 mt-4 grid overflow-hidden rounded-3xl bg-secondary/40 lg:mb-14 lg:mt-5 lg:grid-cols-2">
      {/* Left: CMS image (Dashboard → CMS → Section Backgrounds → "login"), brand panel until one is set */}
      <aside className="relative hidden min-h-[640px] overflow-hidden bg-foreground text-background lg:block">
        {image ? (
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-[#4d1224] to-[#241f1c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <img src="/logo_2.png" alt="Surokkha" className="h-12 w-auto self-start" />
          <div>
            <p className="font-display text-3xl font-bold leading-snug">Safe today, tomorrow too.</p>
            <p className="mt-2 max-w-sm text-background/80">Discreet packaging, genuine products and cash on delivery.</p>
          </div>
        </div>
      </aside>

      {/* Mobile: slim banner using the same image */}
      <div className="relative h-36 overflow-hidden bg-foreground lg:hidden">
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="relative flex h-full flex-col justify-end gap-1.5 p-5">
          <Breadcrumb current={crumb[view]} onDark />
          <p className="font-display text-2xl font-bold text-background">Safe today, tomorrow too.</p>
        </div>
      </div>

      {/* Right: forms */}
      <main className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="w-full max-w-xl">
          {checking ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {(view === 'login' || view === 'signup') && (
                <div className="mb-6 grid grid-cols-2 rounded-full border border-border bg-card p-1 text-sm font-semibold" role="tablist">
                  {(['login', 'signup'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={view === tab}
                      onClick={() => go(tab)}
                      className={`rounded-full py-2 transition-colors ${view === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {tab === 'login' ? 'Log in' : 'Sign up'}
                    </button>
                  ))}
                </div>
              )}

              <h1 className="font-display text-3xl font-bold">{heading[view].title}</h1>
              <p className="mt-1 text-muted-foreground">{heading[view].sub}</p>
              {notice && <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm">{notice}</p>}

              {view === 'login' && (
                <form onSubmit={submitLogin} className="mt-6 space-y-4">
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" required />
                  </Field>
                  <Field label="Password">
                    <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
                  </Field>
                  <div className="text-right text-sm">
                    <button type="button" className={link} onClick={() => go('forgot')}>
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className={primary} disabled={busy}>
                    {busy ? 'Please wait...' : 'Log in'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    New to Surokkha?{' '}
                    <button type="button" className={link} onClick={() => go('signup')}>
                      Create an account
                    </button>
                  </p>
                </form>
              )}

              {view === 'signup' && (
                <form onSubmit={submitSignup} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
                  <Field label="Full name">
                    <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-11" required />
                  </Field>
                  <Field label="Mobile number (optional)">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(toEnDigits(e.target.value))}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="01XXXXXXXXX"
                      className="h-11"
                    />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" required />
                  </Field>
                  <Field label="Password" hint={`At least ${MIN_PASSWORD} characters`}>
                    <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
                  </Field>
                  <Button type="submit" className={`${primary} sm:col-span-2`} disabled={busy}>
                    {busy ? 'Please wait...' : 'Create account'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground sm:col-span-2">
                    Already have an account?{' '}
                    <button type="button" className={link} onClick={() => go('login')}>
                      Log in
                    </button>
                  </p>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={submitForgot} className="mt-6 space-y-4">
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" required />
                  </Field>
                  <Button type="submit" className={primary} disabled={busy}>
                    {busy ? 'Sending...' : 'Send reset code'}
                  </Button>
                  <p className="text-center text-sm">
                    <button type="button" className={link} onClick={() => go('login')}>
                      Back to log in
                    </button>
                  </p>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={submitReset} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Email">
                    <Input type="email" value={email} readOnly className="h-11 bg-muted/40" />
                  </Field>
                  <Field label="6-digit code">
                    <Input
                      value={code}
                      onChange={(e) => setCode(toEnDigits(e.target.value).replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      className="h-11 tracking-[0.4em]"
                      required
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="New password" hint={`At least ${MIN_PASSWORD} characters`}>
                      <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
                    </Field>
                  </div>
                  <Button type="submit" className={`${primary} sm:col-span-2`} disabled={busy}>
                    {busy ? 'Please wait...' : 'Reset password'}
                  </Button>
                  <p className="flex justify-between text-sm sm:col-span-2">
                    <button type="button" className={link} onClick={resendCode} disabled={busy}>
                      Resend code
                    </button>
                    <button type="button" className={link} onClick={() => go('login')}>
                      Back to log in
                    </button>
                  </p>
                </form>
              )}

              {view === 'account' && customer && (
                <div className="mt-6 space-y-4">
                  <dl className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{customer.name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium break-all">{customer.email}</dd>
                    </div>
                    {customer.phone && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Mobile</dt>
                        <dd className="font-medium">{customer.phone}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex gap-3">
                    <Button className="h-11 flex-1 rounded-full" onClick={() => navigate('/')}>
                      Continue shopping
                    </Button>
                    <Button variant="outline" className="h-11 flex-1 rounded-full" onClick={signOut}>
                      Log out
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}
