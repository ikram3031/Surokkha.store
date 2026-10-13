import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { clientConfig } from '@/clientConfig';
import { toast } from 'sonner';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifyStatus, setVerifyStatus] = useState('loading'); // 'loading' | 'valid' | 'already_registered' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [invitedUser, setInvitedUser] = useState(null);

  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify invitation token
  useEffect(() => {
    if (!token) {
      setVerifyStatus('error');
      setErrorMessage('No invitation token found in link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await apiClient.get('/api/v1/auth/invite/verify', {
          params: { token },
        });

        const resData = response.data;
        if (resData.status === 'already_registered') {
          setVerifyStatus('already_registered');
          setInvitedUser(resData.data || null);
        } else if (resData.status === 'valid') {
          setVerifyStatus('valid');
          setInvitedUser(resData.data || null);
        } else {
          setVerifyStatus('error');
          setErrorMessage(resData.message || 'Invalid or expired invitation link.');
        }
      } catch (err) {
        console.error('Invite verification failed:', err);
        const msg =
          err.response?.data?.message ||
          'Invalid or expired invitation link. Please request a new invite from your administrator.';
        setVerifyStatus('error');
        setErrorMessage(msg);
      }
    };

    verify();
  }, [token]);

  // Password Strength Rules
  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const isPasswordValid = passwordRules.every((r) => r.valid);
  const isMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleAcceptInvite = async (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('Please meet all password strength requirements.');
      return;
    }

    if (!isMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/invite/accept', {
        token,
        password,
        confirmPassword,
      });

      setIsSuccess(true);
      toast.success('Account activated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary mb-2 shadow-xs">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {clientConfig?.brandName || 'Dashboard'} Onboarding
          </h1>
          <p className="text-xs text-muted-foreground">
            Secure user onboarding and team invitation portal
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm space-y-5">
          {/* STATE 1: LOADING */}
          {verifyStatus === 'loading' && (
            <div className="space-y-4 py-4 text-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">
                Verifying your invitation link...
              </p>
            </div>
          )}

          {/* STATE 2: ALREADY REGISTERED */}
          {verifyStatus === 'already_registered' && (
            <div className="text-center space-y-4 py-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <UserCheck className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground">
                  Already Registered
                </h3>
                <p className="text-xs text-muted-foreground">
                  {invitedUser?.email ? (
                    <>Account for <strong className="text-foreground">{invitedUser.email}</strong> is already active in our system.</>
                  ) : (
                    'You are already registered with our system.'
                  )}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  className="w-full font-semibold gap-2 shadow-sm"
                >
                  <Link to="/login">
                    Go to Login <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* STATE 3: ERROR / EXPIRED LINK */}
          {verifyStatus === 'error' && (
            <div className="text-center space-y-4 py-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-base text-foreground">
                  Invitation Invalid
                </h3>
                <p className="text-xs text-muted-foreground">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Link to="/login">
                    Return to Login Page
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* STATE 4: VALID INVITATION - PASSWORD SETUP FORM */}
          {verifyStatus === 'valid' && !isSuccess && (
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              {/* User Info Header */}
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {invitedUser?.name || 'New Team Member'}
                  </span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {invitedUser?.role || 'Marketing Expert'}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground block font-mono">
                  {invitedUser?.email}
                </span>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Create New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-9 h-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground block">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
                {confirmPassword && !isMatch && (
                  <span className="text-[11px] text-destructive">
                    Passwords do not match
                  </span>
                )}
              </div>

              {/* Password Strength Checklist */}
              <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5 text-[11px]">
                <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider">
                  Password Requirements
                </span>
                {passwordRules.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {r.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                    )}
                    <span className={r.valid ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !isPasswordValid || !isMatch}
                className="w-full font-semibold shadow-sm text-xs h-9"
              >
                {isSubmitting ? 'Activating Account...' : 'Set Password & Activate'}
              </Button>
            </form>
          )}

          {/* STATE 5: SUCCESS CONFIRMATION */}
          {isSuccess && (
            <div className="text-center space-y-3 py-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Account Activated!
              </h3>
              <p className="text-xs text-muted-foreground">
                Your password has been securely created. Redirecting to login page...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
