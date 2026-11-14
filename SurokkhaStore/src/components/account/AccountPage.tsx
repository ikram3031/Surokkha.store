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
  resendVerification,
  verifyEmail,
  resetPassword,
  type Customer,
} from '@/lib/api/customer-auth'
import { isValidEmail, isValidPhone, localPhone, normalizePhone, toEnDigits } from '@/lib/checkout'
import { ApiError } from '@/lib/api/client'
import { navigate, useSearch } from '@/lib/router'
import { CustomerDashboard } from '@/components/account/CustomerDashboard'
import { L } from '@/lib/i18n'

type View = 'login' | 'signup' | 'verify' | 'forgot' | 'reset' | 'account'

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
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b5f63] hover:text-[#1f1a1c]"
        aria-label={shown ? L('Hide password', 'পাসওয়ার্ড লুকান') : L('Show password', 'পাসওয়ার্ড দেখুন')}
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function Breadcrumb({ current, onDark = false }: { current: string; onDark?: boolean }) {
  return (
    <nav aria-label={L('Breadcrumb', 'ব্রেডক্রাম্ব')} className={`flex items-center gap-2 text-sm ${onDark ? 'text-white/80' : 'text-muted-foreground'}`}>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate('/')
        }}
        className={onDark ? 'hover:text-white' : 'hover:text-primary'}
      >
        {L('Home', 'হোম')}
      </a>
      <span aria-hidden="true">/</span>
      <span className={`font-semibold ${onDark ? 'text-white' : 'text-foreground'}`} aria-current="page">
        {current}
      </span>
    </nav>
  )
}

export function AccountPage() {
  // CMS image (Dashboard → CMS → Section Backgrounds → "login") wins; otherwise the bundled default photo
  const image = useSectionBackground('login') || '/auth/login.webp'
  // /account?view=signup (the menu's Register button) opens on the sign up form, ?view=login back on log in
  const search = useSearch()
  const [view, setView] = useState<View>('login')
  useEffect(() => {
    const wanted = new URLSearchParams(search).get('view')
    if (wanted === 'signup' || wanted === 'login') setView(wanted)
  }, [search])
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
      toast.error(err instanceof Error ? err.message : L('Something went wrong. Please try again.', 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।'))
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
    run(async () => {
      try {
        enter(await login({ email: email.trim(), password }))
      } catch (err) {
        // Signed up but never entered the emailed code: the server has sent a new one
        if (err instanceof ApiError && (err.body as { code?: string } | null)?.code === 'EMAIL_NOT_VERIFIED') {
          setView('verify')
          setCode('')
          setNotice(err.message)
          return
        }
        throw err
      }
    })
  }

  const submitVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return toast.error(L('Enter the 6-digit code from your email', 'ইমেইলে পাঠানো ৬ ডিজিটের কোডটি লিখুন'))
    run(async () => {
      enter(await verifyEmail({ email: email.trim(), otp: code }))
      toast.success(L('Email verified. Your account is ready.', 'ইমেইল যাচাই হয়েছে। আপনার অ্যাকাউন্ট প্রস্তুত।'))
    })
  }

  const resendSignupCode = () =>
    run(async () => {
      const res = await resendVerification(email.trim())
      setNotice(res.message)
    })

  const submitSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return toast.error(L('Please enter your name', 'অনুগ্রহ করে আপনার নাম লিখুন'))
    if (!isValidPhone(phone)) return toast.error(L('Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)', '১১ ডিজিটের সঠিক বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)'))
    if (!isValidEmail(email)) return toast.error(L('Please enter a valid email address', 'অনুগ্রহ করে একটি সঠিক ইমেইল লিখুন'))
    if (password.length < MIN_PASSWORD) return toast.error(L(`Password must be at least ${MIN_PASSWORD} characters`, `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে`))
    run(async () => {
      const res = await register({ name: name.trim(), email: email.trim(), password, phone: normalizePhone(phone) })
      setView('verify')
      setCode('')
      setNotice(res.message || L('We have emailed you a 6-digit code. Enter it to finish creating your account.', 'আপনার ইমেইলে একটি ৬ ডিজিটের কোড পাঠানো হয়েছে। অ্যাকাউন্ট তৈরি সম্পন্ন করতে কোডটি লিখুন।'))
    })
  }

  const submitForgot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) return toast.error(L('Please enter a valid email address', 'অনুগ্রহ করে একটি সঠিক ইমেইল লিখুন'))
    run(async () => {
      const res = await forgotPassword(email.trim())
      setView('reset')
      setNotice(res.message)
    })
  }

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return toast.error(L('Enter the 6-digit code from your email', 'ইমেইলে পাঠানো ৬ ডিজিটের কোডটি লিখুন'))
    if (password.length < MIN_PASSWORD) return toast.error(L(`Password must be at least ${MIN_PASSWORD} characters`, `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে`))
    run(async () => {
      enter(await resetPassword({ email: email.trim(), otp: code, password }))
      toast.success(L('Password updated. You are now logged in.', 'পাসওয়ার্ড আপডেট হয়েছে। আপনি এখন লগইন অবস্থায় আছেন।'))
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
    login: { title: L('Welcome back', 'আবার স্বাগতম'), sub: L('Log in to your Surokkha account.', 'আপনার সুরক্ষা অ্যাকাউন্টে লগইন করুন।') },
    signup: { title: L('Create your account', 'অ্যাকাউন্ট তৈরি করুন'), sub: L('Quick to set up, and your details stay private.', 'দ্রুত তৈরি করুন, আপনার তথ্য গোপন থাকবে।') },
    verify: { title: L('Verify your email', 'ইমেইল যাচাই করুন'), sub: L('Enter the 6-digit code we sent to your email.', 'আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি লিখুন।') },
    forgot: { title: L('Forgot your password?', 'পাসওয়ার্ড ভুলে গেছেন?'), sub: L('Enter your email and we\'ll send you a 6-digit code.', 'আপনার ইমেইল লিখুন, আমরা একটি ৬ ডিজিটের কোড পাঠাব।') },
    reset: { title: L('Reset your password', 'পাসওয়ার্ড রিসেট করুন'), sub: L('Enter the code we emailed you and choose a new password.', 'ইমেইলে পাঠানো কোডটি লিখে নতুন পাসওয়ার্ড দিন।') },
    account: { title: customer ? `${L('Hello', 'হ্যালো')}, ${customer.name.split(' ')[0]}` : L('My Account', 'আমার অ্যাকাউন্ট'), sub: L('You are logged in.', 'আপনি লগইন অবস্থায় আছেন।') },
  }

  const crumb: Record<View, string> = {
    login: L('Log in', 'লগইন'),
    signup: L('Sign up', 'সাইন আপ'),
    verify: L('Verify email', 'ইমেইল যাচাই'),
    forgot: L('Forgot password', 'পাসওয়ার্ড ভুলে গেছেন'),
    reset: L('Reset password', 'পাসওয়ার্ড রিসেট'),
    account: L('My Account', 'আমার অ্যাকাউন্ট'),
  }

  const primary = 'h-11 w-full rounded-full text-base'
  const link = 'font-semibold text-primary underline-offset-4 hover:underline'

  if (!checking && view === 'account' && customer) {
    return <CustomerDashboard customer={customer} onSignOut={signOut} />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 lg:pt-8">
      <div className="hidden lg:block">
        <Breadcrumb current={crumb[view]} />
      </div>
      {/* One dark card (header colour) on the white page: the image runs edge to edge, no inner padding */}
      <div className="auth-card dark mb-10 mt-4 grid overflow-hidden rounded-3xl bg-header/90 text-foreground lg:mb-14 lg:mt-5 lg:grid-cols-2">
      {/* Left: CMS image (Dashboard → CMS → Section Backgrounds → "login"), brand panel until one is set */}
      <aside className="dark relative hidden min-h-[640px] overflow-hidden bg-background text-white lg:block">
        {image ? (
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-[#4d1224] to-[#241f1c]" />
        )}
        {/* Dark overlay: heaviest at the bottom behind the tagline */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        {/* Soft dark glow in the top-left corner so the logo stands out from the photo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.35)_28%,transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <img src="/surokkha_store_logo_dark.png" alt={L('Surokkha Store', 'সুরক্ষা স্টোর')} className="h-12 w-auto self-start drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
          <div>
            <p className="font-display text-3xl font-bold leading-snug">{L('Safe today, tomorrow too.', 'আজও নিরাপদ, আগামীকালও।')}</p>
            <p className="mt-2 max-w-sm text-white/80">{L('Discreet packaging, genuine products and cash on delivery.', 'গোপনীয় প্যাকেজিং, আসল প্রোডাক্ট ও ক্যাশ অন ডেলিভারি।')}</p>
          </div>
        </div>
      </aside>

      {/* Mobile: slim banner using the same image */}
      <div className="relative h-36 overflow-hidden bg-background lg:hidden">
        {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative flex h-full flex-col justify-end gap-1.5 p-5">
          <Breadcrumb current={crumb[view]} onDark />
          <p className="font-display text-2xl font-bold text-white">{L('Safe today, tomorrow too.', 'আজও নিরাপদ, আগামীকালও।')}</p>
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
                      {tab === 'login' ? L('Log in', 'লগইন') : L('Sign up', 'সাইন আপ')}
                    </button>
                  ))}
                </div>
              )}

              <h1 className="font-display text-3xl font-bold">{heading[view].title}</h1>
              <p className="mt-1 text-muted-foreground">{heading[view].sub}</p>
              {notice && <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm">{notice}</p>}

              {view === 'login' && (
                <form onSubmit={submitLogin} className="mt-6 space-y-4">
                  <Field label={L('Email', 'ইমেইল')}>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" required />
                  </Field>
                  <Field label={L('Password', 'পাসওয়ার্ড')}>
                    <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
                  </Field>
                  <div className="text-right text-sm">
                    <button type="button" className={link} onClick={() => go('forgot')}>
                      {L('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?')}
                    </button>
                  </div>
                  <Button type="submit" className={primary} disabled={busy}>
                    {busy ? L('Please wait...', 'অপেক্ষা করুন...') : L('Log in', 'লগইন')}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {L('New to Surokkha?', 'সুরক্ষায় নতুন?')}{' '}
                    <button type="button" className={link} onClick={() => go('signup')}>
                      {L('Create an account', 'অ্যাকাউন্ট তৈরি করুন')}
                    </button>
                  </p>
                </form>
              )}

              {view === 'signup' && (
                <form onSubmit={submitSignup} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
                  <Field label={L('Full name', 'পূর্ণ নাম')}>
                    <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-11" required />
                  </Field>
                  <Field label={L('Mobile number', 'মোবাইল নম্বর')} hint={phone && !isValidPhone(phone) ? L('Enter a valid Bangladeshi number, e.g. 01712345678', 'সঠিক বাংলাদেশি নম্বর দিন, যেমন: 01712345678') : undefined}>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(toEnDigits(e.target.value).replace(/[^\d+]/g, '').slice(0, 14))}
                      // Pasting +8801..., 8801... or 1... becomes the local 01XXXXXXXXX form
                      onPaste={(e) => {
                        e.preventDefault()
                        setPhone(localPhone(e.clipboardData.getData('text')))
                      }}
                      onBlur={() => phone && setPhone(localPhone(phone))}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="01XXXXXXXXX"
                      className="h-11"
                      required
                    />
                  </Field>
                  <Field label={L('Email', 'ইমেইল')}>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" required />
                  </Field>
                  <Field label={L('Password', 'পাসওয়ার্ড')} hint={L(`At least ${MIN_PASSWORD} characters`, `কমপক্ষে ${MIN_PASSWORD} অক্ষর`)}>
                    <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
                  </Field>
                  <Button type="submit" className={`${primary} sm:col-span-2`} disabled={busy}>
                    {busy ? L('Please wait...', 'অপেক্ষা করুন...') : L('Create account', 'অ্যাকাউন্ট তৈরি করুন')}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground sm:col-span-2">
                    {L('Already have an account?', 'আগে থেকেই অ্যাকাউন্ট আছে?')}{' '}
                    <button type="button" className={link} onClick={() => go('login')}>
                      {L('Log in', 'লগইন')}
                    </button>
                  </p>
                </form>
              )}

              {view === 'verify' && (
                <form onSubmit={submitVerify} className="mt-6 space-y-4">
                  <Field label={L('Email', 'ইমেইল')}>
                    <Input type="email" value={email} readOnly className="h-11 bg-muted/40" />
                  </Field>
                  <Field label={L('6-digit code', '৬ ডিজিটের কোড')}>
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
                  <Button type="submit" className={primary} disabled={busy}>
                    {busy ? L('Please wait...', 'অপেক্ষা করুন...') : L('Verify and continue', 'যাচাই করে এগিয়ে যান')}
                  </Button>
                  <p className="flex justify-between text-sm">
                    <button type="button" className={link} onClick={resendSignupCode} disabled={busy}>
                      {L('Resend code', 'আবার কোড পাঠান')}
                    </button>
                    <button type="button" className={link} onClick={() => go('login')}>
                      {L('Back to log in', 'লগইনে ফিরে যান')}
                    </button>
                  </p>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={submitForgot} className="mt-6 space-y-4">
                  <Field label={L('Email', 'ইমেইল')}>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" required />
                  </Field>
                  <Button type="submit" className={primary} disabled={busy}>
                    {busy ? L('Sending...', 'পাঠানো হচ্ছে...') : L('Send reset code', 'রিসেট কোড পাঠান')}
                  </Button>
                  <p className="text-center text-sm">
                    <button type="button" className={link} onClick={() => go('login')}>
                      {L('Back to log in', 'লগইনে ফিরে যান')}
                    </button>
                  </p>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={submitReset} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label={L('Email', 'ইমেইল')}>
                    <Input type="email" value={email} readOnly className="h-11 bg-muted/40" />
                  </Field>
                  <Field label={L('6-digit code', '৬ ডিজিটের কোড')}>
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
                    <Field label={L('New password', 'নতুন পাসওয়ার্ড')} hint={L(`At least ${MIN_PASSWORD} characters`, `কমপক্ষে ${MIN_PASSWORD} অক্ষর`)}>
                      <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
                    </Field>
                  </div>
                  <Button type="submit" className={`${primary} sm:col-span-2`} disabled={busy}>
                    {busy ? L('Please wait...', 'অপেক্ষা করুন...') : L('Reset password', 'পাসওয়ার্ড রিসেট করুন')}
                  </Button>
                  <p className="flex justify-between text-sm sm:col-span-2">
                    <button type="button" className={link} onClick={resendCode} disabled={busy}>
                      {L('Resend code', 'আবার কোড পাঠান')}
                    </button>
                    <button type="button" className={link} onClick={() => go('login')}>
                      {L('Back to log in', 'লগইনে ফিরে যান')}
                    </button>
                  </p>
                </form>
              )}

              {view === 'account' && customer && (
                <div className="mt-6 space-y-4">
                  <dl className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{L('Name', 'নাম')}</dt>
                      <dd className="font-medium">{customer.name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{L('Email', 'ইমেইল')}</dt>
                      <dd className="font-medium break-all">{customer.email}</dd>
                    </div>
                    {customer.phone && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{L('Mobile', 'মোবাইল')}</dt>
                        <dd className="font-medium">{customer.phone}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex gap-3">
                    <Button className="h-11 flex-1 rounded-full" onClick={() => navigate('/')}>
                      {L('Continue shopping', 'আরও কেনাকাটা করুন')}
                    </Button>
                    <Button variant="outline" className="h-11 flex-1 rounded-full" onClick={signOut}>
                      {L('Log out', 'লগ আউট')}
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
