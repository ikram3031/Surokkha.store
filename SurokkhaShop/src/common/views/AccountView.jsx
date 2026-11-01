import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import logoDark from '../asset/logo_v2.png';
import {
  fetchCurrentCustomer,
  forgotPassword,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  resetPassword,
} from '../utils/customerAuth';

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT = {
  en: {
    login: 'Log in', signup: 'Sign up', logout: 'Log out', home: 'Home', account: 'My Account',
    tagline: 'Safe today, tomorrow too.', taglineSub: 'Discreet packaging, genuine products and cash on delivery.',
    welcomeBack: 'Welcome back', welcomeSub: 'Log in to your Surokkha account.',
    createTitle: 'Create your account', createSub: 'Quick to set up, and your details stay private.',
    forgotTitle: 'Forgot your password?', forgotSub: "Enter your email and we'll send you a 6-digit code.",
    resetTitle: 'Reset your password', resetSub: 'Enter the code we emailed you and choose a new password.',
    hello: 'Hello', loggedIn: 'You are logged in.',
    name: 'Full name', phone: 'Mobile number (optional)', email: 'Email', password: 'Password', newPassword: 'New password',
    passwordHint: `At least ${MIN_PASSWORD} characters`, code: '6-digit code',
    forgotLink: 'Forgot password?', newHere: 'New to Surokkha?', createLink: 'Create an account',
    haveAccount: 'Already have an account?', createBtn: 'Create account', sendCode: 'Send reset code', resetBtn: 'Reset password',
    resend: 'Resend code', back: 'Back to log in', wait: 'Please wait...', sending: 'Sending...',
    show: 'Show', hide: 'Hide', mobile: 'Mobile', continueShopping: 'Continue shopping',
    errName: 'Please enter your name', errEmail: 'Please enter a valid email address',
    errPassword: `Password must be at least ${MIN_PASSWORD} characters`, errCode: 'Enter the 6-digit code from your email',
    passwordUpdated: 'Password updated. You are now logged in.',
  },
  bn: {
    login: 'লগ ইন', signup: 'সাইন আপ', logout: 'লগ আউট', home: 'হোম', account: 'আমার অ্যাকাউন্ট',
    tagline: 'আজ নিরাপদ, আগামীতেও।', taglineSub: 'গোপন প্যাকেজিং, আসল পণ্য এবং ক্যাশ অন ডেলিভারি।',
    welcomeBack: 'আবার স্বাগতম', welcomeSub: 'আপনার সুরক্ষা অ্যাকাউন্টে লগ ইন করুন।',
    createTitle: 'অ্যাকাউন্ট তৈরি করুন', createSub: 'কয়েক সেকেন্ডেই হয়ে যাবে, আপনার তথ্য গোপন থাকবে।',
    forgotTitle: 'পাসওয়ার্ড ভুলে গেছেন?', forgotSub: 'ইমেইল দিন, আমরা ৬ ডিজিটের একটি কোড পাঠাব।',
    resetTitle: 'পাসওয়ার্ড রিসেট', resetSub: 'ইমেইলে পাঠানো কোড দিয়ে নতুন পাসওয়ার্ড দিন।',
    hello: 'হ্যালো', loggedIn: 'আপনি লগ ইন করা আছেন।',
    name: 'পুরো নাম', phone: 'মোবাইল নম্বর (ঐচ্ছিক)', email: 'ইমেইল', password: 'পাসওয়ার্ড', newPassword: 'নতুন পাসওয়ার্ড',
    passwordHint: `কমপক্ষে ${MIN_PASSWORD} অক্ষর`, code: '৬ ডিজিটের কোড',
    forgotLink: 'পাসওয়ার্ড ভুলে গেছেন?', newHere: 'সুরক্ষায় নতুন?', createLink: 'অ্যাকাউন্ট তৈরি করুন',
    haveAccount: 'আগে থেকেই অ্যাকাউন্ট আছে?', createBtn: 'অ্যাকাউন্ট তৈরি করুন', sendCode: 'রিসেট কোড পাঠান', resetBtn: 'পাসওয়ার্ড রিসেট করুন',
    resend: 'কোড আবার পাঠান', back: 'লগ ইনে ফিরে যান', wait: 'অপেক্ষা করুন...', sending: 'পাঠানো হচ্ছে...',
    show: 'দেখান', hide: 'লুকান', mobile: 'মোবাইল', continueShopping: 'কেনাকাটা চালিয়ে যান',
    errName: 'আপনার নাম লিখুন', errEmail: 'সঠিক ইমেইল ঠিকানা দিন',
    errPassword: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে`, errCode: 'ইমেইলে পাঠানো ৬ ডিজিটের কোড দিন',
    passwordUpdated: 'পাসওয়ার্ড পরিবর্তন হয়েছে, আপনি এখন লগ ইন করা আছেন।',
  },
};

const inputClass =
  'w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20';
const primaryBtn =
  'w-full h-11 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm transition disabled:opacity-60 cursor-pointer';
const linkBtn = 'font-semibold text-rose-700 hover:underline cursor-pointer';

// Bengali digits are common on phone keyboards here
const toEnDigits = (s) => String(s).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function PasswordInput({ value, onChange, autoComplete, t }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`${inputClass} pr-16`}
        required
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
      >
        {shown ? t.hide : t.show}
      </button>
    </div>
  );
}

export default function AccountView() {
  const { isBn } = useTranslation();
  const t = isBn ? TEXT.bn : TEXT.en;
  const navigateTo = useStore((state) => state.navigateTo);
  const showToast = useStore((state) => state.showToast);

  const [view, setView] = useState('login'); // login | signup | forgot | reset | account
  const [customer, setCustomer] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchCurrentCustomer().then((c) => {
      if (cancelled) return;
      if (c) {
        setCustomer(c);
        setView('account');
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (next) => {
    setView(next);
    setNotice('');
    setPassword('');
    setCode('');
  };

  const run = async (task) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } catch (err) {
      showToast(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const enter = (c) => {
    setCustomer(c);
    setPassword('');
    setCode('');
    setNotice('');
    setView('account');
  };

  const submitLogin = (e) => {
    e.preventDefault();
    run(async () => enter(await loginCustomer({ email: email.trim(), password })));
  };

  const submitSignup = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return showToast(t.errName);
    if (!EMAIL_RE.test(email.trim())) return showToast(t.errEmail);
    if (password.length < MIN_PASSWORD) return showToast(t.errPassword);
    const digits = toEnDigits(phone).replace(/\D/g, '').slice(-11);
    run(async () =>
      enter(await registerCustomer({ name: name.trim(), email: email.trim(), password, phone: digits || undefined }))
    );
  };

  const submitForgot = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return showToast(t.errEmail);
    run(async () => {
      const res = await forgotPassword(email.trim());
      setView('reset');
      setNotice(res.message);
    });
  };

  const submitReset = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return showToast(t.errCode);
    if (password.length < MIN_PASSWORD) return showToast(t.errPassword);
    run(async () => {
      enter(await resetPassword({ email: email.trim(), otp: code, password }));
      showToast(t.passwordUpdated);
    });
  };

  const resendCode = () =>
    run(async () => {
      const res = await forgotPassword(email.trim());
      setNotice(res.message);
    });

  const signOut = () => {
    logoutCustomer();
    setCustomer(null);
    setView('login');
  };

  const heading = {
    login: [t.welcomeBack, t.welcomeSub],
    signup: [t.createTitle, t.createSub],
    forgot: [t.forgotTitle, t.forgotSub],
    reset: [t.resetTitle, t.resetSub],
    account: [`${t.hello}${customer ? `, ${customer.name.split(' ')[0]}` : ''}`, t.loggedIn],
  }[view];

  const crumb = { login: t.login, signup: t.signup, forgot: t.forgotTitle, reset: t.resetBtn, account: t.account }[view];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 lg:pt-8">
      <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
        <button type="button" onClick={() => navigateTo('home')} className="hover:text-rose-700 cursor-pointer">{t.home}</button>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-slate-900" aria-current="page">{crumb}</span>
      </nav>
      {/* One light-tinted rounded card; brand panel on the left, forms on the right (same layout as SurokkhaStore) */}
      <div className="mb-10 mt-4 grid overflow-hidden rounded-3xl bg-rose-50/60 lg:mb-14 lg:grid-cols-2">
        <aside className="relative hidden min-h-[640px] overflow-hidden bg-slate-900 text-white lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#4d1224] to-[#241f1c]" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <img src={logoDark} alt="Surokkha" className="h-12 w-auto self-start" />
            <div>
              <p className="text-3xl font-extrabold leading-snug">{t.tagline}</p>
              <p className="mt-2 max-w-sm text-white/80">{t.taglineSub}</p>
            </div>
          </div>
        </aside>

        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-900 via-[#4d1224] to-[#241f1c] lg:hidden">
          <div className="relative flex h-full flex-col justify-end gap-1 p-5">
            <p className="text-xl font-extrabold text-white">{t.tagline}</p>
          </div>
        </div>

        <main className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="w-full max-w-xl">
        {checking ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-700" />
          </div>
        ) : (
          <>
            {(view === 'login' || view === 'signup') && (
              <div className="mb-6 grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-bold" role="tablist">
                {['login', 'signup'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={view === tab}
                    onClick={() => go(tab)}
                    className={`rounded-full py-2 transition-colors cursor-pointer ${
                      view === tab ? 'bg-rose-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'login' ? t.login : t.signup}
                  </button>
                ))}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{heading[0]}</h1>
            <p className="mt-1 text-slate-600">{heading[1]}</p>
            {notice && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-slate-800">{notice}</p>}

            {view === 'login' && (
              <form onSubmit={submitLogin} className="mt-6 space-y-4">
                <Field label={t.email}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} required />
                </Field>
                <Field label={t.password}>
                  <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" t={t} />
                </Field>
                <div className="text-right text-sm">
                  <button type="button" className={linkBtn} onClick={() => go('forgot')}>{t.forgotLink}</button>
                </div>
                <button type="submit" className={primaryBtn} disabled={busy}>{busy ? t.wait : t.login}</button>
                <p className="text-center text-sm text-slate-600">
                  {t.newHere}{' '}
                  <button type="button" className={linkBtn} onClick={() => go('signup')}>{t.createLink}</button>
                </p>
              </form>
            )}

            {view === 'signup' && (
              <form onSubmit={submitSignup} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
                <Field label={t.name}>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} required />
                </Field>
                <Field label={t.phone}>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(toEnDigits(e.target.value))}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    className={inputClass}
                  />
                </Field>
                <Field label={t.email}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} required />
                </Field>
                <Field label={t.password} hint={t.passwordHint}>
                  <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" t={t} />
                </Field>
                <button type="submit" className={`${primaryBtn} sm:col-span-2`} disabled={busy}>{busy ? t.wait : t.createBtn}</button>
                <p className="text-center text-sm text-slate-600 sm:col-span-2">
                  {t.haveAccount}{' '}
                  <button type="button" className={linkBtn} onClick={() => go('login')}>{t.login}</button>
                </p>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={submitForgot} className="mt-6 space-y-4">
                <Field label={t.email}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} required />
                </Field>
                <button type="submit" className={primaryBtn} disabled={busy}>{busy ? t.sending : t.sendCode}</button>
                <p className="text-center text-sm">
                  <button type="button" className={linkBtn} onClick={() => go('login')}>{t.back}</button>
                </p>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={submitReset} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label={t.email}>
                  <input type="email" value={email} readOnly className={`${inputClass} bg-slate-50`} />
                </Field>
                <Field label={t.code}>
                  <input
                    value={code}
                    onChange={(e) => setCode(toEnDigits(e.target.value).replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className={`${inputClass} tracking-[0.4em]`}
                    required
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t.newPassword} hint={t.passwordHint}>
                    <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" t={t} />
                  </Field>
                </div>
                <button type="submit" className={`${primaryBtn} sm:col-span-2`} disabled={busy}>{busy ? t.wait : t.resetBtn}</button>
                <p className="flex justify-between text-sm sm:col-span-2">
                  <button type="button" className={linkBtn} onClick={resendCode} disabled={busy}>{t.resend}</button>
                  <button type="button" className={linkBtn} onClick={() => go('login')}>{t.back}</button>
                </p>
              </form>
            )}

            {view === 'account' && customer && (
              <div className="mt-6 space-y-4">
                <dl className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t.name}</dt>
                    <dd className="font-semibold text-slate-900">{customer.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">{t.email}</dt>
                    <dd className="font-semibold text-slate-900 break-all">{customer.email}</dd>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">{t.mobile}</dt>
                      <dd className="font-semibold text-slate-900">{customer.phone}</dd>
                    </div>
                  )}
                </dl>
                <div className="flex gap-3">
                  <button type="button" className={`${primaryBtn} flex-1`} onClick={() => navigateTo('shop')}>{t.continueShopping}</button>
                  <button
                    type="button"
                    className="flex-1 h-11 rounded-full border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={signOut}
                  >
                    {t.logout}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </main>
      </div>
    </div>
  );
}
