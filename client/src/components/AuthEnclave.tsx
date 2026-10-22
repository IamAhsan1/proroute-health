import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, UserProfile } from '../api/client';
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
}

export const AuthEnclave: React.FC<AuthEnclaveProps> = ({ onSuccess }) => {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Real-World Password Recovery Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotSentEmail, setForgotSentEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Real-World URL-based Password Reset State (when user arrives via email link)
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

    // Email verification link clicked
    if ((path.includes('verify-email') || params.has('verifyEmail')) && token) {
      api
        .verifyEmail({ token })
        .then(() => {
          setGlobalSuccess('Your email has been verified successfully! You can now sign in.');
          window.history.replaceState({}, document.title, window.location.pathname.replace(/verify-email/g, ''));
        })
        .catch((err: unknown) => {
          setGlobalError(err instanceof Error ? err.message : 'Email verification failed.');
        });
      return;
    }

    // Password reset link clicked
    if ((path.includes('reset-password') || params.has('token') || params.has('resetToken')) && token) {
      setResetTokenFromUrl(token);
    }
  }, []);

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '578283653549-f79dk5hic5oldtidrkikl1s3ai4nnf28.apps.googleusercontent.com';

    const initGoogleAuth = () => {
      if (window.google?.accounts?.id) {
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
                setGlobalSuccess('Google Authentication Verified');
                setTimeout(() => {
                  onSuccess(res.data!.user);
                }, 600);
              }
            } catch (err: unknown) {
              if (err instanceof Error) {
                setGlobalError(err.message);
              } else {
                setGlobalError('Google sign-in failed.');
              }
            }
          },
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 380,
            logo_alignment: 'left',
          });
        }
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
    try {
      const res = await api.login(data);
      if (res.data?.user) {
        setGlobalSuccess('Secure Session Established');
        setTimeout(() => {
          onSuccess(res.data!.user);
        }, 600);
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
    try {
      const res = await api.register({
        email: data.email,
        password: data.password,
        role: role === 'doctor' ? 'DOCTOR' : 'PATIENT',
        name: data.name,
      });
      if (res.data?.user) {
        setGlobalSuccess('Clinical Account Created Successfully');
        setTimeout(() => {
          onSuccess(res.data!.user);
        }, 600);
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
      window.history.replaceState({}, document.title, '/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResetError(err.message);
      } else {
        setResetError('Password reset failed. Please request a new link.');
      }
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-2rem)] py-12 px-4 relative overflow-hidden select-none">
      {/* Dynamic Ambient Clinical Glows & Telemetry Watermark */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-container/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Medical Waveform Telemetry Watermark SVG */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1200 400"
          className="w-[1400px] h-[450px] text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M 0,200 L 250,200 L 280,130 L 310,270 L 340,90 L 370,310 L 400,180 L 430,220 L 460,200 L 700,200 L 730,120 L 760,290 L 790,70 L 820,330 L 850,170 L 880,220 L 910,200 L 1200,200" />
        </svg>
      </div>

      {/* Clinical Glassmorphism Enclave Card */}
      <div className="w-full max-w-[440px] bg-surface-container-low/95 backdrop-blur-xl border border-surface-container-high rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Enclave Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(78,222,163,0.12)] border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[28px]">
              vital_signs
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">ProRoute Health</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Unified Clinical Access & Scheduling Gateway
          </p>

          {/* HIPAA / Clinical Grade Badge */}
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest/60 text-on-surface-variant text-[11px] font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-semibold text-primary">HIPAA Compliant</span>
            <span className="text-on-surface-variant/40">•</span>
            <span>PMDC Clinical Enclave</span>
          </div>
        </div>

        {/* Global Enclave Status Alerts */}
        {globalError && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{globalError}</span>
          </div>
        )}

        {globalSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-primary-container/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{globalSuccess}</span>
          </div>
        )}

        {resetTokenFromUrl ? (
          /* Real-world URL Password Reset Form */
          <div className="flex flex-col gap-4">
            <div className="text-center mb-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-2">
                <span className="material-symbols-outlined text-[24px]">lock_reset</span>
              </div>
              <h2 className="text-base font-bold text-on-surface">Create New Password</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Enter and confirm your new secure password.
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit(onResetPassword)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-on-surface-variant font-semibold" htmlFor="reset-new-password">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                    lock
                  </span>
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
                    <span className="material-symbols-outlined text-[18px]">
                      {showResetNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {resetErrors.newPassword ? (
                  <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    {resetErrors.newPassword.message}
                  </span>
                ) : (
                  <span className="text-[10px] text-outline">
                    8-128 characters, with uppercase, lowercase, number, and special character.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-on-surface-variant font-semibold" htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                    lock_clock
                  </span>
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
                    <span className="material-symbols-outlined text-[18px]">
                      {showResetConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    {resetErrors.confirmPassword.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isResetSubmitting}
                className="w-full py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all cursor-pointer disabled:opacity-50"
              >
                {isResetSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetTokenFromUrl(null);
                  resetResetForm();
                  window.history.replaceState({}, document.title, '/');
                }}
                className="w-full text-center text-xs text-on-surface-variant hover:text-on-surface py-1 cursor-pointer"
              >
                Cancel & Return to Sign In
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Segmented Role Selector */}
            <div className="w-full bg-surface-container-lowest p-1 rounded-lg flex items-center justify-between gap-1 mb-5">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  role === 'patient'
                    ? 'bg-surface-container-high text-primary shadow-[0_0_16px_rgba(78,222,163,0.15)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  role === 'doctor'
                    ? 'bg-surface-container-high text-primary shadow-[0_0_16px_rgba(78,222,163,0.15)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Doctor / Specialist</span>
              </button>
            </div>

            {/* Auth Mode Switcher (Sign In vs Create Account) */}
            <div className="flex items-center justify-center gap-8 mb-6 relative">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setGlobalError(null);
                  resetLoginForm();
                }}
                className={`pb-2 text-sm font-bold transition-colors duration-150 relative cursor-pointer ${
                  mode === 'signin' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
                {mode === 'signin' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_#4edea3]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setGlobalError(null);
                  resetSignupForm();
                }}
                className={`pb-2 text-sm font-bold transition-colors duration-150 relative cursor-pointer ${
                  mode === 'signup' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create Account
                {mode === 'signup' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_#4edea3]" />
                )}
              </button>
            </div>

            {/* Dynamic Form Body: Sign In Form */}
            {mode === 'signin' ? (
              <form onSubmit={handleLoginSubmit(onLogin)} className="flex flex-col gap-4">
                {/* Email Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="login-email">
                      Email Address
                    </label>
                    {role === 'doctor' && (
                      <span className="text-[10px] text-secondary font-mono tracking-tight uppercase px-1.5 py-0.5 rounded bg-surface-container-high border border-secondary/20">
                        PMDC / NPI Verified
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                      mail
                    </span>
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
                      <span className="material-symbols-outlined text-[13px]">error</span>
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
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                      lock
                    </span>
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
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {loginErrors.password && (
                    <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {loginErrors.password.message}
                    </span>
                  )}
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoginSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed shadow-[0_0_20px_rgba(78,222,163,0.25)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoginSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </span>
                  ) : (
                    <>
                      <span>{role === 'doctor' ? 'Sign In to Clinical Portal' : 'Sign In to Your Account'}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
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
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                      badge
                    </span>
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
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {signupErrors.name.message}
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="signup-email">
                      {role === 'doctor' ? 'Clinical Institutional Email' : 'Patient Email Address'}
                    </label>
                    {role === 'doctor' && (
                      <span className="text-[10px] text-secondary font-mono tracking-tight uppercase px-1.5 py-0.5 rounded bg-surface-container-high border border-secondary/20">
                        PMDC / NPI Verified
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                      mail
                    </span>
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
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {signupErrors.email.message}
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface-variant font-semibold tracking-wide" htmlFor="signup-password">
                    Create Strong Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                      lock
                    </span>
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
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {signupErrors.password ? (
                    <span className="text-[11px] text-error flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">error</span>
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
                  className="w-full mt-2 py-3 px-4 rounded-lg bg-primary text-on-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed shadow-[0_0_20px_rgba(78,222,163,0.25)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSignupSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    <>
                      <span>{role === 'doctor' ? 'Apply for Clinical Credentials' : 'Create ProRoute Account'}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
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
            <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
            <span>End-to-end 256-bit clinical encryption</span>
          </div>
          <p className="text-[11px] text-outline">
            Your medical records and consultation telemetry remain encrypted in transit and at rest.
          </p>
        </div>
      </div>

      {/* Password Recovery Modal (Real-world Email-only flow with React Hook Form) */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-container-low rounded-xl p-6 border border-surface-container-high shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
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
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSent ? (
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
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
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
                      mail
                    </span>
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
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {forgotErrors.email.message}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all cursor-pointer disabled:opacity-50"
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
