import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, UserProfile } from '../api/client';
import {
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Lock,
  Activity,
  FileCheck,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  KeyRound,
} from 'lucide-react';
import {
  loginFormSchema,
  LoginFormData,
  registerFormSchema,
  RegisterFormData,
  forgotPasswordFormSchema,
  ForgotPasswordFormData,
  resetPasswordFormSchema,
  ResetPasswordFormData,
} from '../schemas/auth.schema';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: number | string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface AuthEnclaveProps {
  onSuccess: (user: UserProfile) => void;
  currentUser?: UserProfile | null;
  initialMode?: 'signin' | 'signup';
}

export const AuthEnclave: React.FC<AuthEnclaveProps> = ({
  onSuccess,
  currentUser,
  initialMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectToDashboard = (user: UserProfile) => {
    if (user.role === 'DOCTOR') {
      navigate('/doctor/dashboard', { replace: true });
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      navigate('/admin/verifications', { replace: true });
    } else {
      navigate('/doctors', { replace: true });
    }
  };

  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      redirectToDashboard(currentUser);
    }
  }, [currentUser]);

  // Synchronize role and mode from query parameters or pathname
  const searchParams = new URLSearchParams(location.search);
  const paramRole = searchParams.get('role');
  const paramMode = searchParams.get('mode');

  const [role, setRole] = useState<'patient' | 'doctor'>(
    paramRole === 'doctor' ? 'doctor' : 'patient'
  );
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    if (initialMode) return initialMode;
    if (location.pathname === '/register' || paramMode === 'signup') return 'signup';
    return 'signin';
  });

  // Keep mode in sync if user navigates via browser back/forward
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode('signin');
    }
  }, [location.pathname]);

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setGlobalError(null);
    setSignupSent(false);
    if (newMode === 'signin') {
      resetLoginForm();
      navigate('/login', { replace: true });
    } else {
      resetSignupForm();
      navigate('/register', { replace: true });
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Email Verification State (after signup)
  const [signupSent, setSignupSent] = useState(false);
  const [signupSentEmail, setSignupSentEmail] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendVerificationSuccess, setResendVerificationSuccess] = useState<string | null>(null);

  // Password Recovery Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotSentEmail, setForgotSentEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // URL-based Password Reset State
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // --- React Hook Form Instances with Zod Validation ---
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    reset: resetLoginForm,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
    setValue: setSignupValue,
    reset: resetSignupForm,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', role: 'PATIENT' },
    mode: 'onTouched',
  });

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
    reset: resetForgotForm,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
    reset: resetResetForm,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  // Sync role changes with signup form
  useEffect(() => {
    setSignupValue('role', role === 'doctor' ? 'DOCTOR' : 'PATIENT');
  }, [role, setSignupValue]);

  // Detect email verification or password reset tokens in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('resetToken');
    const path = window.location.pathname;

    if ((path.includes('verify-email') || params.has('verifyEmail')) && token) {
      api
        .verifyEmail({ token })
        .then(() => {
          setGlobalSuccess('Your email has been verified successfully! You can now sign in with your credentials.');
          window.history.replaceState({}, document.title, window.location.pathname.replace(/verify-email/g, ''));
        })
        .catch((err: unknown) => {
          setGlobalError(err instanceof Error ? err.message : 'Email verification failed or token expired.');
        });
      return;
    }

    if ((path.includes('reset-password') || params.has('token') || params.has('resetToken')) && token) {
      setResetTokenFromUrl(token);
    }
  }, []);

  // Handle Resend Verification Email
  const handleResendVerification = async (targetEmail: string) => {
    setResendingVerification(true);
    setResendVerificationSuccess(null);
    try {
      await api.resendVerification({ email: targetEmail });
      setResendVerificationSuccess(`A fresh verification email has been dispatched to ${targetEmail}.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError('Failed to resend verification email.');
      }
    } finally {
      setResendingVerification(false);
    }
  };

  // Google OAuth2 initialization
  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '578283653549-f79dk5hic5oldtidrkikl1s3ai4nnf28.apps.googleusercontent.com';

    const initGoogleAuth = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              setGlobalError('Google authentication did not return an identity token.');
              return;
            }
            setGlobalError(null);
            try {
              const res = await api.googleAuth({
                idToken: response.credential,
                role: role === 'doctor' ? 'DOCTOR' : 'PATIENT',
              });
              if (res.data?.user) {
                const authedUser = res.data.user;
                setGlobalSuccess('Google Identity Verified. Establishing session...');
                setTimeout(() => {
                  onSuccess(authedUser);
                  redirectToDashboard(authedUser);
                }, 500);
              }
            } catch (err: unknown) {
              if (err instanceof Error) {
                setGlobalError(err.message);
              } else {
                setGlobalError('Google Sign-In failed. Please try again.');
              }
            }
          },
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
      }
    };

    initGoogleAuth();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        initGoogleAuth();
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [role, onSuccess]);

  // Form Submit Handlers
  const onLogin = async (data: LoginFormData) => {
    setGlobalError(null);
    setGlobalSuccess(null);
    setUnverifiedEmail(null);
    setResendVerificationSuccess(null);
    try {
      const res = await api.login(data);
      if (res.data?.user) {
        const authedUser = res.data.user;

        // Block unverified sign in
        if (!authedUser.isEmailVerified) {
          await api.logout().catch(() => {});
          setUnverifiedEmail(authedUser.email);
          setGlobalError(
            `Your email address (${authedUser.email}) is not verified yet. Please check your inbox and verify your email before signing in.`
          );
          return;
        }

        setGlobalSuccess('Secure Session Established. Redirecting...');
        setTimeout(() => {
          onSuccess(authedUser);
          redirectToDashboard(authedUser);
        }, 500);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError('An unexpected error occurred during sign in.');
      }
    }
  };

  const onSignup = async (data: RegisterFormData) => {
    setGlobalError(null);
    setGlobalSuccess(null);
    setUnverifiedEmail(null);
    setResendVerificationSuccess(null);
    try {
      const res = await api.register({
        email: data.email,
        password: data.password,
        role: role === 'doctor' ? 'DOCTOR' : 'PATIENT',
        name: data.name,
      });
      if (res.data?.user) {
        // Clear any auto-set registration cookies so user remains unauthenticated until email verification
        await api.logout().catch(() => {});
        setSignupSentEmail(data.email);
        setSignupSent(true);
        resetSignupForm();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError('An unexpected error occurred during account creation.');
      }
    }
  };

  const onForgotPassword = async (data: ForgotPasswordFormData) => {
    setForgotError(null);
    try {
      await api.forgotPassword(data);
      setForgotSentEmail(data.email);
      setForgotSent(true);
      resetForgotForm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setForgotError(err.message);
      } else {
        setForgotError('Failed to dispatch password recovery link.');
      }
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    if (!resetTokenFromUrl) return;
    setResetError(null);
    try {
      await api.resetPassword({
        token: resetTokenFromUrl,
        newPassword: data.newPassword,
      });
      setGlobalSuccess('Your password has been updated successfully! Please sign in with your new password.');
      setResetTokenFromUrl(null);
      resetResetForm();
      setMode('signin');
      window.history.replaceState({}, document.title, '/login');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResetError(err.message);
      } else {
        setResetError('Password reset failed. Please request a new link.');
      }
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-2rem)] py-12 px-4 relative select-none">
      {/* Split Canvas Clinical Enclave Card */}
      <div className="w-full max-w-4xl bg-surface-container border border-surface-container-highest rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10">
        {/* Left Column: Clinical Trust & Security Hero (Desktop & Tablet) */}
        <div className="hidden md:flex md:col-span-5 bg-slate-900 border-r border-surface-container-highest text-white p-8 flex-col justify-between relative overflow-hidden">
          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-white shadow-xs">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-headline font-bold text-sm tracking-wide text-white block">ProRoute Health</span>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide block">Verified Clinical Network</span>
              </div>
            </div>
          </div>

          {/* Center Trust Value Props */}
          <div className="relative z-10 my-auto py-6 flex flex-col gap-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest/60 border border-surface-container-highest text-emerald-300 text-[11px] font-medium self-start">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PMDC &amp; Healthcare Security Compliant</span>
            </div>

            <h2 className="text-2xl font-headline font-bold text-white leading-snug">
              Direct Access to Board-Certified Specialists.
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Instant appointment scheduling, verified PMDC medical credentials, and real-time consultation records with zero double-booking.
            </p>

            <div className="flex flex-col gap-2.5 text-xs mt-1">
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] text-slate-200">Private &amp; Secure Patient Care</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <Activity className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] text-slate-200">Guaranteed Real-Time Slot Booking</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <FileCheck className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] text-slate-200">Encrypted Medical Records Vault</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Seals */}
          <div className="relative z-10 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>256-Bit SSL Encrypted</span>
            <span>PMDC Verified Network</span>
          </div>
        </div>

        {/* Right Column: Interactive Enclave Form */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-surface-container/90">
          {/* Mobile-only Brand Header */}
          <div className="md:hidden flex items-center justify-center gap-2.5 mb-5 text-center">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Stethoscope className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold text-on-surface">ProRoute Health</h1>
              <p className="text-[10px] text-outline uppercase tracking-wider">Patient &amp; Doctor Portal</p>
            </div>
          </div>

          {/* Desktop Right Header */}
          <div className="hidden md:block mb-5">
            <h2 className="text-lg font-bold text-on-surface">Welcome to ProRoute</h2>
            <p className="text-xs text-on-surface-variant">Sign in to your account or register below.</p>
          </div>

          {/* Global Enclave Status Alerts */}
          {globalError && (
            <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-error" />
                <span>{globalError}</span>
              </div>
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={() => handleResendVerification(unverifiedEmail)}
                  disabled={resendingVerification}
                  className="self-start text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{resendingVerification ? 'Sending Email...' : 'Resend Verification Email'}</span>
                </button>
              )}
            </div>
          )}

          {resendVerificationSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-primary-container/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-primary" />
              <span>{resendVerificationSuccess}</span>
            </div>
          )}

          {globalSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-primary-container/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-primary" />
              <span>{globalSuccess}</span>
            </div>
          )}

          {resetTokenFromUrl ? (
            /* URL Password Reset Form */
            <div className="flex flex-col gap-4">
              <div className="text-center mb-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                  <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-base font-bold text-on-surface">Create New Password</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Enter and confirm your new secure password.
                </p>
              </div>

              {resetError && (
                <div className="p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-error" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit(onResetPassword)} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface-variant font-semibold" htmlFor="reset-new-password">
                    New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                    <input
                      id="reset-new-password"
                      type={showResetNewPassword ? 'text' : 'password'}
                      {...registerReset('newPassword')}
                      placeholder="••••••••••••"
                      className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-10 py-2.5 rounded-lg border transition-all ${
                        resetErrors.newPassword ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                      } focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      className="absolute right-3 text-outline hover:text-on-surface p-1 cursor-pointer"
                    >
                      {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {resetErrors.newPassword && (
                    <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-error" />
                      {resetErrors.newPassword.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface-variant font-semibold" htmlFor="reset-confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                    <input
                      id="reset-confirm-password"
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      {...registerReset('confirmPassword')}
                      placeholder="••••••••••••"
                      className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-10 py-2.5 rounded-lg border transition-all ${
                        resetErrors.confirmPassword ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                      } focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      className="absolute right-3 text-outline hover:text-on-surface p-1 cursor-pointer"
                    >
                      {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {resetErrors.confirmPassword && (
                    <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-error" />
                      {resetErrors.confirmPassword.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="w-full py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isResetSubmitting ? 'Updating Password...' : 'Save New Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetTokenFromUrl(null);
                    resetResetForm();
                    window.history.replaceState({}, document.title, '/login');
                  }}
                  className="w-full text-center text-xs text-on-surface-variant hover:text-on-surface py-1 cursor-pointer"
                >
                  Cancel &amp; Return to Sign In
                </button>
              </form>
            </div>
          ) : signupSent ? (
            /* Real-world Check Your Inbox Screen after Registration */
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-xl text-on-surface">Verify Your Email Address</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
                We have dispatched an official verification email to <span className="text-on-surface font-semibold">{signupSentEmail}</span>.
                Please check your inbox (and spam/junk folder) and click the verification link to activate your {role === 'doctor' ? 'doctor' : 'patient'} account.
              </p>

              <div className="w-full mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSignupSent(false);
                    switchMode('signin');
                  }}
                  className="w-full py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed transition-colors cursor-pointer shadow-xs"
                >
                  Proceed to Sign In
                </button>

                <button
                  type="button"
                  onClick={() => handleResendVerification(signupSentEmail)}
                  disabled={resendingVerification}
                  className="w-full py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-semibold cursor-pointer transition-colors"
                >
                  {resendingVerification ? 'Resending...' : 'Resend Verification Email'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Segmented Role Selector */}
              <div className="w-full bg-surface-container-lowest p-1 rounded-lg flex items-center justify-between gap-1 mb-5 border border-surface-container-highest">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    role === 'patient'
                      ? 'bg-surface-container-high text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
                  }`}
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    role === 'doctor'
                      ? 'bg-surface-container-high text-primary font-bold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Doctor / Specialist</span>
                </button>
              </div>

              {/* Auth Mode Switcher (Sign In vs Create Account) */}
              <div className="flex items-center justify-center gap-8 mb-6 relative">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`pb-2 text-sm font-bold transition-colors duration-150 relative cursor-pointer ${
                    mode === 'signin' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Sign In
                  {mode === 'signin' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`pb-2 text-sm font-bold transition-colors duration-150 relative cursor-pointer ${
                    mode === 'signup' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Create Account
                  {mode === 'signup' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>
              </div>

              {/* Sign In Form */}
              {mode === 'signin' ? (
                <form onSubmit={handleLoginSubmit(onLogin)} className="flex flex-col gap-4">
                  {/* Email Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="login-email">
                      {role === 'doctor' ? 'Doctor / Clinic Email' : 'Email Address'}
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                      <input
                        id="login-email"
                        type="email"
                        {...registerLogin('email')}
                        placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'patient@gmail.com'}
                        className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-4 py-2.5 rounded-lg border transition-all ${
                          loginErrors.email ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                        } focus:outline-none`}
                      />
                    </div>
                    {loginErrors.email && (
                      <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-error" />
                        {loginErrors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="login-password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotOpen(true);
                          setForgotError(null);
                          setForgotSent(false);
                        }}
                        className="text-[11px] text-secondary hover:text-secondary-fixed transition-colors font-medium cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        {...registerLogin('password')}
                        placeholder="••••••••••••"
                        className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-10 py-2.5 rounded-lg border transition-all ${
                          loginErrors.password ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                        } focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-error" />
                        {loginErrors.password.message}
                      </span>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="w-full mt-2 py-3 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed shadow-xs transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoginSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </span>
                    ) : (
                      <span>{role === 'doctor' ? 'Sign In as Doctor' : 'Sign In'}</span>
                    )}
                  </button>
                </form>
              ) : (
                /* Create Account Form */
                <form onSubmit={handleSignupSubmit(onSignup)} className="flex flex-col gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="signup-name">
                      Full Legal Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                      <input
                        id="signup-name"
                        type="text"
                        {...registerSignup('name')}
                        placeholder={role === 'doctor' ? 'Dr. Sarah Jenkins' : 'Sarah Jenkins'}
                        className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-4 py-2.5 rounded-lg border transition-all ${
                          signupErrors.name ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                        } focus:outline-none`}
                      />
                    </div>
                    {signupErrors.name && (
                      <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-error" />
                        {signupErrors.name.message}
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="signup-email">
                      {role === 'doctor' ? 'Doctor / Clinic Email' : 'Email Address'}
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                      <input
                        id="signup-email"
                        type="email"
                        {...registerSignup('email')}
                        placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'patient@gmail.com'}
                        className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-4 py-2.5 rounded-lg border transition-all ${
                          signupErrors.email ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                        } focus:outline-none`}
                      />
                    </div>
                    {signupErrors.email && (
                      <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-error" />
                        {signupErrors.email.message}
                      </span>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="signup-password">
                      Create Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        {...registerSignup('password')}
                        placeholder="••••••••••••"
                        className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm pl-10 pr-10 py-2.5 rounded-lg border transition-all ${
                          signupErrors.password ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                        } focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1 flex items-center justify-center cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupErrors.password ? (
                      <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-error" />
                        {signupErrors.password.message}
                      </span>
                    ) : (
                      <span className="text-[10px] text-outline">
                        Must be 8-128 chars with uppercase, lowercase, number, and special character.
                      </span>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSignupSubmitting}
                    className="w-full mt-2 py-3 px-4 rounded-lg bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed shadow-xs transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSignupSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </span>
                    ) : (
                      <span>{role === 'doctor' ? 'Create Doctor Account' : 'Create Patient Account'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Visual Separator */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="w-full h-px bg-surface-container-highest" />
                <span className="absolute px-3 bg-surface-container-low text-[11px] font-semibold text-outline uppercase tracking-wider">
                  or continue with
                </span>
              </div>

              {/* Federated Authentication: Official Google Sign-In Button */}
              <div className="flex flex-col gap-2.5 items-center justify-center min-h-[44px]">
                <div ref={googleButtonRef} className="w-full flex justify-center" />
              </div>
            </>
          )}

          {/* Security & Encryption Guarantee Footer */}
          <div className="mt-6 pt-4 flex flex-col items-center text-center gap-1.5 border-t border-surface-container-highest">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-semibold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>End-to-end 256-bit clinical encryption</span>
            </div>
            <p className="text-[11px] text-outline">
              Your medical records and consultation history remain private and securely encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-container-low rounded-xl p-6 border border-surface-container-high shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-on-surface">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setForgotError(null);
                  setForgotSent(false);
                  resetForgotForm();
                }}
                className="text-outline hover:text-on-surface p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSent ? (
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-sm font-bold text-on-surface">Check Your Inbox</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                  If an account exists with <span className="text-on-surface font-semibold">{forgotSentEmail}</span>, we have sent instructions to reset your password. Please check your inbox and click the link in that email to proceed.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotSent(false);
                    resetForgotForm();
                  }}
                  className="mt-2 w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-semibold cursor-pointer transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit(onForgotPassword)} className="flex flex-col gap-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter your registered email address and we'll send you a secure link to reset your password.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface-variant font-semibold" htmlFor="forgot-email-input">
                    Account Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
                    <input
                      id="forgot-email-input"
                      type="email"
                      {...registerForgot('email')}
                      placeholder="name@example.com"
                      className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs pl-10 pr-3.5 py-2.5 rounded-lg border transition-all ${
                        forgotErrors.email ? 'border-error focus:border-error' : 'border-outline-variant/30 focus:border-primary'
                      } focus:outline-none`}
                    />
                  </div>
                  {forgotErrors.email && (
                    <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-error" />
                      {forgotErrors.email.message}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isForgotSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthEnclave;
