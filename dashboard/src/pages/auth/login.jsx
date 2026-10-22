import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { handleGlobalError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { LanguageToggle } from '@/components/LanguageToggle';
import plexiviaLogo from '@/assets/plexivia.png';
import { clientConfig } from '@/clieentConfig';
import { apiClient } from '@/lib/api-client';
import { BrandLogo } from '@/components/BrandLogo';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';

const TURNSTILE_SITE_KEY = '0x4AAAAAAFgNwrn1AkNRO5';

// Renders the secure store administration authentication and MFA/OTP verification portal
const LoginPage = () => {
  const { t } = useTranslation();
  const { user, login, verify2fa, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const captchaRef = useRef(null);

  // Step 1: Login Form, Step 2: Verify MFA Code
  const [step, setStep] = useState(1);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [is2faVerifying, setIs2faVerifying] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);

  // Countdown timer for Resend OTP (180 seconds = 03:00)
  const [timeLeft, setTimeLeft] = useState(177); // Default 02:57 to match layout
  const timerRef = useRef(null);

  const digit0Ref = useRef(null);
  const digit1Ref = useRef(null);
  const digit2Ref = useRef(null);
  const digit3Ref = useRef(null);
  const digit4Ref = useRef(null);
  const digit5Ref = useRef(null);
  const inputRefs = [digit0Ref, digit1Ref, digit2Ref, digit3Ref, digit4Ref, digit5Ref];

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isAuthLoading, navigate]);

  useEffect(() => {
    if (step === 2) {
      // Focus first input box
      setTimeout(() => {
        if (inputRefs[0].current) {
          inputRefs[0].current.focus();
        }
      }, 100);

      // Start Countdown Timer
      setTimeLeft(177);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index, e) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/\D/g, '');

    // Handle full 6-digit paste
    if (cleanVal.length === 6) {
      const newDigits = cleanVal.split('');
      setOtpDigits(newDigits);
      if (inputRefs[5].current) inputRefs[5].current.focus();
      triggerVerify(cleanVal);
      return;
    }

    const singleVal = cleanVal ? cleanVal.slice(-1) : '';
    const newDigits = [...otpDigits];
    newDigits[index] = singleVal;
    setOtpDigits(newDigits);

    if (singleVal && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      triggerVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setOtpDigits(newDigits);
    const focusIdx = Math.min(pasteData.length, 5);
    inputRefs[focusIdx].current?.focus();
    if (pasteData.length === 6) {
      triggerVerify(pasteData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.invalid_credentials', 'Please enter both email and password.'));
      return;
    }
    if (TURNSTILE_SITE_KEY && !captcha) {
      toast.error('Please complete the Cloudflare verification first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password, captcha);
      if (res && res.requires2fa) {
        setStep(2);
        toast.info(res.message || 'Please enter the 6-digit code from your MFA device.');
      } else {
        toast.success(t('auth.welcome_back', 'Logged in successfully.'));
      }
    } catch (err) {
      handleGlobalError(err);
      // A Turnstile token is single-use, so get a fresh one before the next attempt
      captchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectOtpScreen = () => {
    if (!email) {
      toast.error('Please enter your email address first.');
      return;
    }
    setStep(2);
  };

  const triggerVerify = async (codeToVerify) => {
    if (is2faVerifying) return;
    setIs2faVerifying(true);
    try {
      await verify2fa(email, password, codeToVerify);
      toast.success(t('auth.welcome_back', 'MFA verified successfully. Welcome to the Dashboard.'));
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIs2faVerifying(false);
    }
  };

  const handleVerifyButtonClick = (e) => {
    if (e) e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter the full 6-digit MFA code.');
      return;
    }
    triggerVerify(fullCode);
  };

  const handleGetQrCodeViaEmail = async () => {
    if (!email) {
      toast.error('Please provide your email address.');
      return;
    }
    setIsRequestingQr(true);
    try {
      const response = await apiClient.post('/api/v1/auth/2fa/send-qr', { email, password });
      toast.success(
        response.data?.message || `A setup QR code and key have been emailed to ${email}.`
      );
      setTimeLeft(180); // Reset countdown timer to 03:00
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIsRequestingQr(false);
    }
  };

  const handleCancel = () => {
    setStep(1);
    setOtpDigits(['', '', '', '', '', '']);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 border-3 border-border border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-medium font-sans">{t('common.loading', 'Booting secure session...')}</span>
      </div>
    );
  }

  const brandName = clientConfig?.brandName || 'Flexivia';

  return (
    <div className="min-h-screen w-screen max-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground">
      <div className="absolute top-4 right-4 z-30">
        <LanguageToggle className="bg-muted/80 border-border text-muted-foreground hover:bg-muted" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[430px] relative z-10 my-auto"
      >
        <Card className="shadow-2xl border border-border bg-card text-card-foreground backdrop-blur-2xl overflow-hidden rounded-3xl">

          {step === 1 ? (
            /* ========================================================================= */
            /* STEP 1: PASSWORD LOGIN SCREEN                                             */
            /* ========================================================================= */
            <>
              <div className="px-6 pt-6 pb-4 text-center border-b border-border/50">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <BrandLogo className="h-[40px] w-auto mx-auto" centered />
                  <span className="text-[12px] font-medium text-muted-foreground mt-3">
                    {t('auth.sign_in_desc', 'Enter your credentials to manage your store.')}
                  </span>
                </div>
              </div>

              <CardContent className="p-6 sm:p-7 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted-foreground">
                      {t('auth.email', 'Email Address')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                        <Mail className="h-[18px] w-[18px]" />
                      </span>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-11 text-sm bg-muted/50 border-transparent text-foreground focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 rounded-xl transition-all"
                        placeholder="admin@plexivia.online"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-muted-foreground">
                        {t('auth.password', 'Password')}
                      </label>
                      <a href="#" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                        {t('auth.forgot_password', 'Forgot Password?')}
                      </a>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                        <Lock className="h-[18px] w-[18px]" />
                      </span>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-11 text-sm bg-muted/50 border-transparent text-foreground focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 rounded-xl transition-all font-medium tracking-widest"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </div>

                  <TurnstileWidget ref={captchaRef} siteKey={TURNSTILE_SITE_KEY} onToken={setCaptcha} />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || (!!TURNSTILE_SITE_KEY && !captcha)}
                      className="w-full h-11 flex items-center justify-center font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      {isSubmitting ? (
                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      ) : (
                        <LogIn className="h-[18px] w-[18px] mr-2" />
                      )}
                      {isSubmitting ? t('auth.logging_in', 'Signing In…') : t('auth.login_button', 'Sign In')}
                    </Button>
                  </div>
                </form>

                {/* Explicit "Login with OTP" Option */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleDirectOtpScreen}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Login with OTP / MFA</span>
                  </button>
                </div>
              </CardContent>
            </>
          ) : (
            /* ========================================================================= */
            /* STEP 2: VERIFY MFA CODE (MATCHING SCREENSHOT DESIGN)                       */
            /* ========================================================================= */
            <div className="p-7 sm:p-8 space-y-6">

              {/* Top Shield Icon */}
              <div className="flex justify-center pt-2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
                  <Shield className="w-12 h-12 text-primary stroke-[2]" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-[26px] font-extrabold text-foreground tracking-tight">
                  Verify MFA Code
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
                  To finish signing in, enter the code from your MFA device below.
                </p>
              </div>

              {/* 6 Square OTP Input Boxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 max-w-[340px] mx-auto" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-12 sm:w-12 sm:h-13 bg-muted/50 border border-border rounded-xl text-center text-xl font-bold text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner select-all"
                    />
                  ))}
                </div>

                {/* Resend OTP countdown timer */}
                <div className="text-right max-w-[340px] mx-auto pt-1">
                  <span className="text-xs text-muted-foreground">
                    Resend OTP in <strong className="text-foreground font-mono">{formatTimer(timeLeft)}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1 max-w-[340px] mx-auto">

                {/* 1. Verify Button */}
                <Button
                  type="button"
                  disabled={is2faVerifying || otpDigits.join('').length !== 6}
                  onClick={handleVerifyButtonClick}
                  className="w-full h-12 flex items-center justify-center font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {is2faVerifying ? (
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  ) : null}
                  {is2faVerifying ? 'Verifying…' : 'Verify'}
                </Button>

                {/* 2. Cancel Button */}
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="cancel"
                  className="w-full h-12 flex items-center justify-center font-bold text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/30 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Cancel
                </Button>

                {/* 3. Get QRCode Via Email Button */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isRequestingQr}
                  onClick={handleGetQrCodeViaEmail}
                  className="w-full h-12 flex items-center justify-center font-bold text-sm border-primary/30 text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {isRequestingQr ? (
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                  ) : null}
                  {isRequestingQr ? 'Sending Email…' : 'Get QRCode Via Email'}
                </Button>

              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Footer Version & Branding */}
      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-mono z-20 select-none">
        v{__APP_VERSION__}
      </p>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex flex-col items-end gap-1 select-none pointer-events-auto">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground/70">
          Powered By
        </span>
        <img
          src={plexiviaLogo}
          alt="Plexivia"
          className="h-6 sm:h-7 w-auto max-w-[130px] sm:max-w-[150px] object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-md"
        />
      </div>
    </div>
  );
};

export default LoginPage;
