import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  QrCode,
  KeyRound,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { getApiErrorMessage } from '@/lib/error-handler';
import { toast } from 'sonner';
import { LanguageToggle } from '@/components/LanguageToggle';
import plexiviaLogo from '@/assets/plexivia.png';
import { apiClient } from '@/lib/api-client';
// Bundled so the login card never depends on the API serving the logo: maroon on light, cream on dark
import surokkhaLogoLight from '@/assets/invoice_logo.png';
import surokkhaLogoDark from '@/assets/surokkha_logo.png';

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);

// Shared field look: filled input with a leading icon, primary ring on focus, red border when invalid
const fieldClass = (invalid) =>
  `relative flex h-10 items-center rounded-lg border bg-muted/60 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30 ${
    invalid ? 'border-destructive' : 'border-transparent'
  }`;
const fieldIconClass = 'pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground';
const inputClass =
  'h-full w-full rounded-lg bg-transparent pl-10 pr-3 text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground';
const primaryBtnClass =
  'inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-60 cursor-pointer';

// Inline error box shown above a form
const ErrorAlert = ({ message }) =>
  message ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;

// Light/dark switch styled as a small amber square button
const ThemeButton = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400 cursor-pointer"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

// Renders the store administration sign-in and MFA verification portal
const LoginPage = () => {
  const { t } = useTranslation();
  const { user, login, verify2fa, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // 'login' → password form, 'code' → MFA code
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [is2faVerifying, setIs2faVerifying] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isAuthLoading, navigate]);

  const goTo = (next) => {
    setStep(next);
    setError('');
    setInvalidField('');
  };

  useEffect(() => {
    if (step === 'code') {
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 60);
    }
  }, [step]);

  const showError = (message, field = '') => {
    setError(message);
    setInvalidField(field);
    setShakeKey((k) => k + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!isEmail(trimmedEmail)) return showError(t('auth.err_email', 'Enter a valid email address.'), 'email');
    if (!password) return showError(t('auth.err_password', 'Enter your password.'), 'password');

    setError('');
    setInvalidField('');
    setIsSubmitting(true);
    try {
      const res = await login(trimmedEmail, password);
      if (res && res.requires2fa) {
        goTo('code');
      } else {
        toast.success(t('auth.welcome_back', 'Logged in successfully.'));
      }
    } catch (err) {
      showError(getApiErrorMessage(err, t('auth.err_creds', 'Incorrect email or password.')), 'password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerVerify = async (code) => {
    if (is2faVerifying) return;
    setIs2faVerifying(true);
    setError('');
    try {
      await verify2fa(email.trim(), password, code);
      toast.success(t('auth.welcome_back', 'Logged in successfully.'));
    } catch (err) {
      showError(getApiErrorMessage(err, t('auth.err_code', "That code didn't work. Try again.")), 'otp');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIs2faVerifying(false);
    }
  };

  // Writes digits starting at a box, moves focus, and submits once all six are filled
  const fillFrom = (start, digits) => {
    const next = [...otpDigits];
    digits.split('').slice(0, 6 - start).forEach((d, k) => {
      next[start + k] = d;
    });
    setOtpDigits(next);
    if (invalidField === 'otp') setInvalidField('');
    otpRefs.current[Math.min(start + digits.length, 5)]?.focus();
    const code = next.join('');
    if (code.length === 6) triggerVerify(code);
  };

  const handleDigitInput = (index, e) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }
    // A full code (autofill) fills every box; otherwise keep the latest typed digit
    fillFrom(index, v.length >= 6 ? v : v.slice(-1));
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const next = [...otpDigits];
      next[index - 1] = '';
      setOtpDigits(next);
      otpRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleDigitPaste = (index, e) => {
    e.preventDefault();
    const v = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (v) fillFrom(index, v);
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) return showError(t('auth.err_digits', 'Enter all 6 digits.'), 'otp');
    triggerVerify(code);
  };

  const handleGetQrCodeViaEmail = async () => {
    setIsRequestingQr(true);
    try {
      const response = await apiClient.post('/api/v1/auth/2fa/send-qr', { email: email.trim(), password });
      toast.success(response.data?.message || `A setup QR code has been emailed to ${email.trim()}.`);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Failed to send the QR code email.'));
    } finally {
      setIsRequestingQr(false);
    }
  };

  // Forgot password: confirm, then the backend emails the admin inbox
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const openForgotDialog = () => {
    if (!isEmail(email.trim())) {
      return showError(t('auth.forgot_need_email', 'Enter your email address first, then press Forgot Password.'), 'email');
    }
    setError('');
    setInvalidField('');
    setIsForgotOpen(true);
  };

  const handleSendForgot = async () => {
    setIsSendingForgot(true);
    try {
      const res = await apiClient.post('/api/v1/auth/forgot-password', { email: email.trim() });
      toast.success(res.data?.message || 'The admin has been notified.');
      setIsForgotOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not contact the admin. Please try again.'));
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handlePasswordKey = (e) => {
    setCapsOn(!!e.getModifierState?.('CapsLock'));
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 border-3 border-border border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-medium font-sans">{t('common.loading', 'Booting secure session...')}</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground font-sans antialiased">
      <style>{`
        @keyframes login-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        @keyframes login-fade-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .login-shake{animation:login-shake .4s}
        .login-step{animation:login-fade-up .25s ease}
      `}</style>

      {/* Soft brand glow behind the card */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/[0.07]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="flex justify-end gap-2 p-3 sm:p-4">
          <ThemeButton />
          <LanguageToggle className="h-9 rounded-lg border-border bg-card text-foreground hover:bg-accent" />
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-6">
          <div
            key={shakeKey}
            className={`w-full max-w-[380px] overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40 ${
              shakeKey > 0 ? 'login-shake' : ''
            }`}
          >
            {/* Brand */}
            <div className="relative px-6 pb-1 pt-6 text-center">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <img src={surokkhaLogoLight} alt="Surokkha" className="mx-auto h-9 w-auto object-contain dark:hidden" />
              <img src={surokkhaLogoDark} alt="Surokkha" className="mx-auto hidden h-9 w-auto object-contain dark:block" />
              <p className="mt-2 text-xs text-muted-foreground">
                {t('auth.sign_in_desc', 'Enter your credentials to manage your store.')}
              </p>
            </div>

            <div className="px-6 pb-6 pt-5">
              {step === 'login' && (
                <section className="login-step">
                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    <ErrorAlert message={error} />

                    <div className="space-y-1.5">
                      <label htmlFor="login-email" className="text-[13px] font-medium text-muted-foreground">
                        {t('auth.email', 'Email Address')}
                      </label>
                      <div className={fieldClass(invalidField === 'email')}>
                        <Mail className={fieldIconClass} />
                        <input
                          id="login-email"
                          type="email"
                          autoComplete="username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={invalidField === 'email'}
                          className={inputClass}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="login-password" className="block text-[13px] font-medium text-muted-foreground">
                        {t('auth.password', 'Password')}
                      </label>
                      <div className={fieldClass(invalidField === 'password')}>
                        <Lock className={fieldIconClass} />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handlePasswordKey}
                          onKeyUp={handlePasswordKey}
                          aria-invalid={invalidField === 'password'}
                          className={`${inputClass} !pr-11`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {capsOn && (
                        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {t('auth.caps_on', 'Caps Lock is on')}
                        </p>
                      )}
                    </div>

                    <button type="submit" disabled={isSubmitting} className={`${primaryBtnClass} !mt-4`}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                      {isSubmitting ? t('auth.logging_in', 'Signing in…') : t('auth.login_button', 'Sign In')}
                    </button>
                  </form>

                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={openForgotDialog}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {t('auth.forgot_password', 'Forgot Password?')}
                    </button>
                  </div>
                </section>
              )}

              {step === 'code' && (
                <section className="login-step">
                  <div>
                    <h2 className="text-lg font-semibold">{t('auth.two_step', 'Two-step verification')}</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {t('auth.two_step_desc', 'Open your authenticator app and enter the 6-digit code.')}
                    </p>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="mt-4 space-y-3" noValidate>
                    <ErrorAlert message={error} />

                    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Verification code">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleDigitInput(idx, e)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={(e) => handleDigitPaste(idx, e)}
                          onFocus={(e) => e.target.select()}
                          aria-label={`Digit ${idx + 1}`}
                          aria-invalid={invalidField === 'otp'}
                          className={`h-11 w-full min-w-0 rounded-lg border bg-muted/60 text-center text-lg font-semibold tabular-nums text-foreground caret-primary transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 ${
                            invalidField === 'otp' ? 'border-destructive' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>

                    <button type="submit" disabled={is2faVerifying} className={primaryBtnClass}>
                      {is2faVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {is2faVerifying ? t('auth.verifying', 'Verifying…') : t('auth.verify', 'Verify')}
                    </button>
                  </form>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => goTo('login')}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700 cursor-pointer"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={isRequestingQr}
                      onClick={handleGetQrCodeViaEmail}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
                    >
                      {isRequestingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                      {isRequestingQr ? t('auth.sending', 'Sending…') : t('auth.qr_email', 'Get QR Code via Email')}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>

        <Dialog open={isForgotOpen} onOpenChange={(open) => !isSendingForgot && setIsForgotOpen(open)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('auth.contact_admin', 'Contact Admin')}</DialogTitle>
              <DialogDescription>
                {t(
                  'auth.contact_admin_desc',
                  'We will email the admin that {{email}} forgot the password. They will reset it and send you the new one.',
                  { email: email.trim() }
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                disabled={isSendingForgot}
                onClick={() => setIsForgotOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={isSendingForgot}
                onClick={handleSendForgot}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
              >
                {isSendingForgot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isSendingForgot ? t('auth.sending', 'Sending…') : t('auth.send_admin_email', 'Send Admin Email')}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <footer className="relative flex items-end justify-center px-4 pb-4 sm:px-6">
          <p className="font-mono text-xs text-muted-foreground select-none">v{__APP_VERSION__}</p>
          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 select-none sm:right-6">
            <span className="text-[11px] text-muted-foreground">Powered By</span>
            <img src={plexiviaLogo} alt="Plexivia" className="h-6 w-auto max-w-[130px] object-contain sm:h-7" />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
