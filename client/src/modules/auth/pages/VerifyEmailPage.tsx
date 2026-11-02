import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from '../../../api/client';
import {
  CheckCircle,
  AlertCircle,
  Send,
  LogIn,
} from 'lucide-react';
import { Button } from '../../../components/ui';

interface VerifyEmailPageProps {
  currentUser?: UserProfile | null;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No verification token provided in the URL. Please check the link sent to your email.');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .verifyEmail({ token: token.trim() })
      .then((res) => {
        if (!isMounted) return;
        setSuccess(res.data?.message || 'Email verified successfully! Your account is now fully active.');
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        queryClient.invalidateQueries({ queryKey: ['myDoctorProfile'] });
      })
      .catch((err: any) => {
        if (!isMounted) return;
        const msg = err.response?.data?.message || err.message || 'Email verification failed or token has expired.';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, queryClient]);

  const handleResend = async () => {
    if (!currentUser?.email) return;
    setResending(true);
    setResendMsg(null);
    try {
      await api.resendVerification({ email: currentUser.email });
      setResendMsg('A fresh verification link has been dispatched to your email address.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container border border-surface-container-highest rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
        {/* 1. Loading State */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-headline font-bold text-lg text-on-surface">Verifying Your Email</h3>
              <p className="text-xs text-on-surface-variant">
                Validating security token with medical registry...
              </p>
            </div>
          </div>
        )}

        {/* 2. Success State */}
        {!loading && success && (
          <div className="flex flex-col items-center gap-4 py-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-xl text-on-surface">Email Verified!</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {success}
              </p>
            </div>

            <div className="w-full mt-4 flex flex-col gap-2">
              {currentUser ? (
                currentUser.role === 'DOCTOR' ? (
                  <Link
                    to="/doctor/profile"
                    className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Continue to Doctor Workspace</span>
                  </Link>
                ) : currentUser.role === 'PATIENT' ? (
                  <Link
                    to="/portal/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Go to Patient Portal</span>
                  </Link>
                ) : (
                  <Link
                    to="/admin/verifications"
                    className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Go to Admin Dashboard</span>
                  </Link>
                )
              ) : (
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Proceed to Sign In</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 3. Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-4 w-full">
            <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center border border-error/20">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-xl text-on-surface">Verification Failed</h3>
              <p className="text-xs text-error font-medium leading-relaxed">
                {error}
              </p>
            </div>

            {resendMsg && (
              <div className="w-full p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                {resendMsg}
              </div>
            )}

            <div className="w-full mt-4 flex flex-col gap-2">
              {currentUser && !currentUser.isEmailVerified && (
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  variant="outline"
                  className="w-full gap-2 text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{resending ? 'Sending Email...' : 'Resend Verification Email'}</span>
                </Button>
              )}

              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
