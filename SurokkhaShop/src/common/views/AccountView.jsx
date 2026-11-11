import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n/useTranslation';
import logoDark from '../asset/surokkha_logo_dark.png';
import loginImage from '../asset/login.webp';
import {
  fetchCurrentCustomer,
  forgotPassword,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  resendVerification,
  resetPassword,
  verifyEmail,
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
    name: 'Full name', phone: 'Mobile number', email: 'Email', password: 'Password', newPassword: 'New password',
    passwordHint: `At least ${MIN_PASSWORD} characters`, code: '6-digit code',
    forgotLink: 'Forgot password?', newHere: 'New to Surokkha?', createLink: 'Create an account',
    haveAccount: 'Already have an account?', createBtn: 'Create account', sendCode: 'Send reset code', resetBtn: 'Reset password',
    resend: 'Resend code', back: 'Back to log in', wait: 'Please wait...', sending: 'Sending...',
    show: 'Show', hide: 'Hide', mobile: 'Mobile', continueShopping: 'Continue shopping',
    errName: 'Please enter your name', errEmail: 'Please enter a valid email address',
    errPassword: `Password must be at least ${MIN_PASSWORD} characters`, errCode: 'Enter the 6-digit code from your email',
    passwordUpdated: 'Password updated. You are now logged in.',
    verifyTitle: 'Verify your email', verifySub: 'Enter the 6-digit code we sent to your email.',
    verifyBtn: 'Verify and continue', verified: 'Email verified. Your account is ready.',
    codeSent: 'We have emailed you a 6-digit code. Enter it to finish creating your account.',
    errPhone: 'Enter a valid Bangladeshi mobile number (01XXXXXXXXX)',
  },
  bn: {
    login: 'লগ ইন', signup: 'সাইন আপ', logout: 'লগ আউট', home: 'হোম', account: 'আমার অ্যাকাউন্ট',
    tagline: 'আজ নিরাপদ, আগামীতেও।', taglineSub: 'গোপন প্যাকেজিং, আসল পণ্য এবং ক্যাশ অন ডেলিভারি।',
    welcomeBack: 'আবার স্বাগতম', welcomeSub: 'আপনার সুরক্ষা অ্যাকাউন্টে লগ ইন করুন।',
    createTitle: 'অ্যাকাউন্ট তৈরি করুন', createSub: 'কয়েক সেকেন্ডেই হয়ে যাবে, আপনার তথ্য গোপন থাকবে।',
    forgotTitle: 'পাসওয়ার্ড ভুলে গেছেন?', forgotSub: 'ইমেইল দিন, আমরা ৬ ডিজিটের একটি কোড পাঠাব।',
    resetTitle: 'পাসওয়ার্ড রিসেট', resetSub: 'ইমেইলে পাঠানো কোড দিয়ে নতুন পাসওয়ার্ড দিন।',
    hello: 'হ্যালো', loggedIn: 'আপনি লগ ইন করা আছেন।',
    name: 'পুরো নাম', phone: 'মোবাইল নম্বর', email: 'ইমেইল', password: 'পাসওয়ার্ড', newPassword: 'নতুন পাসওয়ার্ড',
    passwordHint: `কমপক্ষে ${MIN_PASSWORD} অক্ষর`, code: '৬ ডিজিটের কোড',
    forgotLink: 'পাসওয়ার্ড ভুলে গেছেন?', newHere: 'সুরক্ষায় নতুন?', createLink: 'অ্যাকাউন্ট তৈরি করুন',
    haveAccount: 'আগে থেকেই অ্যাকাউন্ট আছে?', createBtn: 'অ্যাকাউন্ট তৈরি করুন', sendCode: 'রিসেট কোড পাঠান', resetBtn: 'পাসওয়ার্ড রিসেট করুন',
    resend: 'কোড আবার পাঠান', back: 'লগ ইনে ফিরে যান', wait: 'অপেক্ষা করুন...', sending: 'পাঠানো হচ্ছে...',
    show: 'দেখান', hide: 'লুকান', mobile: 'মোবাইল', continueShopping: 'কেনাকাটা চালিয়ে যান',
    errName: 'আপনার নাম লিখুন', errEmail: 'সঠিক ইমেইল ঠিকানা দিন',
    errPassword: `পাসওয়ার্ড কমপক্ষে ${MIN_PASSWORD} অক্ষরের হতে হবে`, errCode: 'ইমেইলে পাঠানো ৬ ডিজিটের কোড দিন',
    passwordUpdated: 'পাসওয়ার্ড পরিবর্তন হয়েছে, আপনি এখন লগ ইন করা আছেন।',
    verifyTitle: 'ইমেইল যাচাই করুন', verifySub: 'আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি দিন।',
    verifyBtn: 'যাচাই করে এগিয়ে যান', verified: 'ইমেইল যাচাই হয়েছে, আপনার অ্যাকাউন্ট তৈরি হয়েছে।',
    codeSent: 'আপনার ইমেইলে ৬ ডিজিটের একটি কোড পাঠানো হয়েছে। অ্যাকাউন্ট তৈরি শেষ করতে কোডটি দিন।',
    errPhone: 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)',
  },
};

const inputClass =
  'w-full h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20';
const primaryBtn =
  'w-full h-11 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm transition disabled:opacity-60 cursor-pointer';
const linkBtn = 'font-semibold text-rose-700 hover:underline cursor-pointer';

// Bengali digits are common on phone keyboards here
const toEnDigits = (s) => String(s).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));

// Bangladeshi mobile in +8801XXXXXXXXX form (same rules as checkout), or '' when it is not one
const bdPhone = (value) => {
  const digits = toEnDigits(value || '').replace(/\D/g, '');
  let n = '';
  if (digits.startsWith('8801') && digits.length >= 13) n = '+880' + digits.slice(3, 13);
  else if (digits.startsWith('01') && digits.length >= 11) n = '+88' + digits.slice(0, 11);
  else if (digits.startsWith('1') && digits.length === 10) n = '+880' + digits;
  return /^\+8801[3-9]\d{8}$/.test(n) ? n : '';
};
// Local 01XXXXXXXXX form for anything pasted or typed (+880 1..., 8801..., 1...)
const localPhone = (value) => {
  const n = bdPhone(value);
  return n ? '0' + n.slice(4) : toEnDigits(value || '').replace(/[^\d+]/g, '');
};

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

  const accountTab = useStore((state) => state.accountTab);
  const [view, setView] = useState(accountTab === 'signup' ? 'signup' : 'login'); // login | signup | forgot | reset | account
  // Menu "Login" / "Register" buttons pick the tab while signed out
  useEffect(() => {
    setView((v) => (v === 'login' || v === 'signup' ? (accountTab === 'signup' ? 'signup' : 'login') : v));
  }, [accountTab]);
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
    run(async () => {
      try {
        enter(await loginCustomer({ email: email.trim(), password }));
      } catch (err) {
        // Signed up but never entered the emailed code: the server has sent a new one
        if (err?.code === 'EMAIL_NOT_VERIFIED') {
          setView('verify');
          setCode('');
          setNotice(err.message);
          return;
        }
        throw err;
      }
    });
  };

  const submitVerify = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return showToast(t.errCode);
    run(async () => {
      enter(await verifyEmail({ email: email.trim(), otp: code }));
      showToast(t.verified);
    });
  };

  const resendSignupCode = () =>
    run(async () => {
      const res = await resendVerification(email.trim());
      setNotice(res.message);
    });

  const submitSignup = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return showToast(t.errName);
    if (!bdPhone(phone)) return showToast(t.errPhone);
    if (!EMAIL_RE.test(email.trim())) return showToast(t.errEmail);
    if (password.length < MIN_PASSWORD) return showToast(t.errPassword);
    const normalized = bdPhone(phone);
    if (!normalized) return showToast(t.errPhone);
    run(async () => {
      await registerCustomer({ name: name.trim(), email: email.trim(), password, phone: normalized });
      setView('verify');
      setCode('');
      setNotice(t.codeSent);
    });
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
    verify: [t.verifyTitle, t.verifySub],
    forgot: [t.forgotTitle, t.forgotSub],
    reset: [t.resetTitle, t.resetSub],
    account: [`${t.hello}${customer ? `, ${customer.name.split(' ')[0]}` : ''}`, t.loggedIn],
  }[view];

  const crumb = { login: t.login, signup: t.signup, verify: t.verifyTitle, forgot: t.forgotTitle, reset: t.resetBtn, account: t.account }[view];

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
          {/* Same photo as the surokkhastore.shop login page, darkened so the text stays readable */}
          <img src={loginImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40" />
          <div className="relative flex h-full flex-col justify-between p-10">
            <img src={logoDark} alt="Surokkha" className="h-12 w-auto self-start" />
            <div>
              <p className="text-3xl font-extrabold leading-snug">{t.tagline}</p>
              <p className="mt-2 max-w-sm text-white/80">{t.taglineSub}</p>
            </div>
          </div>
        </aside>

        <div className="relative h-32 overflow-hidden bg-slate-900 lg:hidden">
          <img src={loginImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/20" />
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
                    onChange={(e) => setPhone(toEnDigits(e.target.value).replace(/[^\d+]/g, '').slice(0, 14))}
                    // Pasting +8801..., 8801... or 1... becomes the local 01XXXXXXXXX form
                    onPaste={(e) => {
                      e.preventDefault();
                      setPhone(localPhone(e.clipboardData.getData('text')));
                    }}
                    onBlur={() => phone && setPhone(localPhone(phone))}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    className={`${inputClass} ${phone && !bdPhone(phone) ? 'border-rose-500' : ''}`}
                    required
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

            {view === 'verify' && (
              <form onSubmit={submitVerify} className="mt-6 space-y-4">
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
                <button type="submit" className={primaryBtn} disabled={busy}>{busy ? t.wait : t.verifyBtn}</button>
                <p className="flex justify-between text-sm">
                  <button type="button" className={linkBtn} onClick={resendSignupCode} disabled={busy}>{t.resend}</button>
                  <button type="button" className={linkBtn} onClick={() => go('login')}>{t.back}</button>
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
