import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from '../api/client';
import { Button, Badge, Input } from './ui';
import { KeyRound, ShieldCheck, CheckCircle2, AlertTriangle, Mail, LogOut, Laptop } from 'lucide-react';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface AccountSecurityCardProps {
  currentUser: UserProfile;
}

export const AccountSecurityCard: React.FC<AccountSecurityCardProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [logoutAllFeedback, setLogoutAllFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const res = await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setStatusMessage({
        type: 'success',
        text: res.message || 'Password updated successfully. Other active sessions have been signed out.',
      });
      reset();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unable to change password. Please verify your current password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? This will invalidate all active sessions immediately.')) {
      return;
    }
    setLogoutAllFeedback(null);
    setIsLoggingOutAll(true);
    try {
      const res = await api.logoutAll();
      setLogoutAllFeedback({
        type: 'success',
        text: res.data?.message || 'Successfully logged out from all devices. Redirecting...',
      });
      setTimeout(() => {
        queryClient.setQueryData(['currentUser'], null);
        queryClient.removeQueries({ queryKey: ['currentUser'] });
        window.location.href = '/';
      }, 1200);
    } catch (err: any) {
      setLogoutAllFeedback({
        type: 'error',
        text: err?.message || 'Failed to revoke device sessions. Please try again.',
      });
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <section className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-6 sm:p-8 shadow-xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-highest/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Account &amp; Security</h2>
            <p className="text-xs text-on-surface-variant">
              Manage your sign-in email status and update your account password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Mail className="w-4 h-4 text-outline" />
          <span className="font-mono text-on-surface">{currentUser.email}</span>
          <Badge variant={currentUser.isEmailVerified ? 'success' : 'warning'}>
            {currentUser.isEmailVerified ? 'Email Verified' : 'Unverified'}
          </Badge>
        </div>
      </div>

      {currentUser.hasPassword === false ? (
        <div className="rounded-xl bg-surface-container-highest/40 border border-outline-variant/30 p-4 flex items-start gap-3 text-sm text-on-surface-variant">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-on-surface">Google Sign-In Account</p>
            <p className="text-xs mt-1 leading-relaxed">
              Your account is authenticated via Google OAuth and does not use a local password. Manage your password
              and 2-step verification directly in your Google Account security settings.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {statusMessage && (
            <div
              role="alert"
              className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-error/10 border-error/30 text-error'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currentPasswordInput" className="text-xs font-semibold text-on-surface">
                Current Password
              </label>
              <Input
                id="currentPasswordInput"
                type="password"
                autoComplete="current-password"
                placeholder="Enter current password"
                error={!!errors.currentPassword}
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-[11px] text-error">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPasswordInput" className="text-xs font-semibold text-on-surface">
                New Password
              </label>
              <Input
                id="newPasswordInput"
                type="password"
                autoComplete="new-password"
                placeholder="Min 8 chars, mixed case & symbol"
                error={!!errors.newPassword}
                {...register('newPassword')}
              />
              {errors.newPassword && <p className="text-[11px] text-error">{errors.newPassword.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPasswordInput" className="text-xs font-semibold text-on-surface">
                Confirm New Password
              </label>
              <Input
                id="confirmPasswordInput"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                error={!!errors.confirmPassword}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}

      {/* Active Sessions & Multi-Device Revocation */}
      <div className="border-t border-surface-container-highest/50 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-container-highest/60 text-outline flex items-center justify-center shrink-0 mt-0.5">
            <Laptop className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-on-surface">Active Sessions &amp; Devices</h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                This device active
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 max-w-md leading-relaxed">
              Lost a device or signed in from a shared computer? Invalidate all active refresh tokens across all browsers immediately.
            </p>
            {logoutAllFeedback && (
              <div
                role="alert"
                className={`mt-2.5 rounded-xl px-3.5 py-2 text-xs font-medium flex items-center gap-2 border ${
                  logoutAllFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-error/10 border-error/30 text-error'
                }`}
              >
                {logoutAllFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{logoutAllFeedback.text}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogoutAll}
          disabled={isLoggingOutAll}
          className="text-error border-error/30 hover:bg-error/10 hover:border-error shrink-0 self-start sm:self-center"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          {isLoggingOutAll ? 'Logging Out All...' : 'Log Out All Devices'}
        </Button>
      </div>
    </section>
  );
};
