import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../../api/client';
import { resetPasswordFormSchema, ResetPasswordFormData } from '../../../schemas/auth.schema';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Missing reset token. Please open the link directly from your email.');
      return;
    }

    setServerError(null);
    try {
      await api.resetPassword({
        token: token.trim(),
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed or token has expired.';
      setServerError(msg);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container/90 border border-surface-container-highest rounded-2xl p-6 sm:p-8 flex flex-col shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Missing Token State */}
        {!token && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md">
              <span className="material-symbols-outlined text-[32px]">link_off</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline font-bold text-xl text-on-surface">Invalid Reset Link</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                No reset token was found in the URL. Please verify you clicked the complete link from your email inbox.
              </p>
            </div>
            <Link
              to="/"
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Return to Sign In
            </Link>
          </div>
        )}

        {/* 2. Success State */}
        {token && isSuccess && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-md">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-xl text-on-surface">Password Updated!</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your password has been changed securely and all existing sessions have been revoked. You can now log in with your new credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-medium text-sm hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Proceed to Sign In
            </button>
          </div>
        )}

        {/* 3. Form State */}
        {token && !isSuccess && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <h2 className="font-headline font-bold text-xl text-on-surface">Set New Password</h2>
              <p className="text-xs text-on-surface-variant">
                Create a strong password with at least 8 characters, numbers, and special symbols.
              </p>
            </div>

            {serverError && (
              <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('newPassword')}
                    className={`w-full bg-surface-container-highest/70 border rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-on-surface outline-none transition-all placeholder:text-outline/50 ${
                      errors.newPassword
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-[11px] text-error font-medium">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className={`w-full bg-surface-container-highest/70 border rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-on-surface outline-none transition-all placeholder:text-outline/50 ${
                      errors.confirmPassword
                        ? 'border-error focus:ring-1 focus:ring-error'
                        : 'border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 text-outline hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-error font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-semibold text-xs tracking-wide uppercase hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                    Update Secure Password
                  </>
                )}
              </button>

              <Link
                to="/"
                className="w-full text-center text-xs text-on-surface-variant hover:text-on-surface py-1 transition-colors"
              >
                Cancel & Return to Sign In
              </Link>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

