import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, Eye, EyeOff, Shield, QrCode, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { handleGlobalError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { LanguageToggle } from '@/components/LanguageToggle';
import plexiviaLogo from '@/assets/plexivia.png';
import { clientConfig } from '@/clientConfig';

// Renders the secure store administration authentication and 2FA verification portal
const LoginPage = () => {
  const { t } = useTranslation();
  const { user, login, verify2fa, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [is2faVerifying, setIs2faVerifying] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isAuthLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.invalid_credentials', 'Please enter both email and password.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res && res.requires2fa) {
        setStep(2);
        toast.info('Verification required. Enter the code from your Google Authenticator app.');
      } else {
        toast.success(t('auth.welcome_back', 'Logged in successfully.'));
      }
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error('Please enter the full 6-digit OTP code.');
      return;
    }

    setIs2faVerifying(true);
    try {
      await verify2fa(email, password, cleanCode);
      toast.success(t('auth.welcome_back', '2FA verified. Welcome to the Dashboard.'));
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIs2faVerifying(false);
    }
  };

  const handleSendQrCode = async () => {
    setIsRequestingQr(true);
    try {
      const response = await apiClient.post('/api/v1/auth/2fa/send-qr', { email, password });
      toast.success(response.data?.message || 'QR Code has been sent to your email.');
    } catch (err) {
      handleGlobalError(err);
    } finally {
      setIsRequestingQr(false);
    }
  };

  const handleCancel2FA = () => {
    setStep(1);
    setOtpCode('');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="h-8 w-8 border-3 border-slate-700 border-t-rose-500 rounded-full animate-spin" />
        <span className="text-xs font-medium font-sans">{t('common.loading', 'Booting secure session...')}</span>
      </div>
    );
  }

  const brandName = clientConfig?.brandName || 'Surokkha';

  return (
    <div className="min-h-screen w-screen max-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500/40 selection:text-white">
      <div className="absolute top-4 right-4 z-30">
        <LanguageToggle className="bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800" />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none opacity-60 animate-pulse [animation-duration:8s]" />
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none opacity-40 animate-pulse [animation-duration:12s]" />

      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10 my-auto"
      >
        <Card className="shadow-2xl shadow-black/80 border border-slate-800/90 bg-slate-900/95 text-white backdrop-blur-2xl overflow-hidden rounded-2xl ring-1 ring-white/10">
          <CardHeader className="px-6 pt-6 pb-4 text-center border-b border-slate-800/80 bg-slate-950/50">
            <CardTitle className="text-xl font-bold tracking-tight flex flex-col items-center justify-center text-white">
              {step === 1 ? (
                <div className="flex flex-col items-center justify-center my-1 gap-1">
                  <span className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight leading-tight">
                    {brandName}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    v{__APP_VERSION__}
                  </span>
                </div>
              ) : (
                '2FA VERIFICATION'
              )}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1 font-medium">
              {step === 1 ? t('auth.sign_in_desc', 'Secure Store Administration Portal') : 'Google Authenticator Verification'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {t('auth.email', 'Email Address')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9.5 h-10 text-sm bg-slate-950/80 border border-slate-700/80 text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-500 rounded-xl transition shadow-inner"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      {t('auth.password', 'Password')}
                    </label>
                    <a href="#" className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:underline transition">
                      {t('auth.forgot_password', 'Forgot?')}
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9.5 pr-10 h-10 text-sm bg-slate-950/80 border border-slate-700/80 text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 placeholder:text-slate-500 rounded-xl transition shadow-inner"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="default"
                    className="w-full h-10 flex items-center justify-center font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 rounded-xl transition cursor-pointer border border-rose-500/40"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-1.5" />
                    )}
                    {isSubmitting ? t('auth.logging_in', 'Signing In…') : t('auth.login_button', 'Log In')}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Google Authenticator Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Shield className="h-4 w-4 text-rose-500" />
                    </span>
                    <Input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-9.5 h-10 text-sm bg-slate-950/80 border border-slate-700/80 text-white focus:border-rose-500 placeholder:text-slate-500 rounded-xl tracking-[0.4em] text-center font-bold"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    type="submit"
                    disabled={is2faVerifying}
                    size="default"
                    className="w-full h-10 flex items-center justify-center font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer shadow-lg shadow-rose-950/50 rounded-xl"
                  >
                    {is2faVerifying ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Shield className="h-4 w-4 mr-1.5" />
                    )}
                    {is2faVerifying ? t('common.loading', 'Verifying…') : t('common.confirm', 'Verify Code')}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRequestingQr}
                    onClick={handleSendQrCode}
                    className="w-full h-10 flex items-center justify-center font-semibold text-xs border border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-200 transition cursor-pointer rounded-xl"
                  >
                    {isRequestingQr ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <QrCode className="h-4 w-4 mr-1.5" />
                    )}
                    Get QR Code via Email
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel2FA}
                    className="w-full h-9 flex items-center justify-center font-semibold text-xs text-slate-400 hover:text-white hover:bg-slate-800/40 transition cursor-pointer rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-mono z-20 select-none">
        v{__APP_VERSION__}
      </p>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex flex-col items-end gap-1 select-none pointer-events-auto">
        <span className="text-xs font-semibold tracking-wide text-slate-400">
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
