import React, { useState } from 'react';
import { api, UserProfile } from '../api/client';

interface AuthStatusProps {
  user: UserProfile;
  onLogout: () => void;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ user, onLogout }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Change Password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email Verification state
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError(null);
    try {
      await api.logout();
      onLogout();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Logout failed');
      }
      onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    setPasswordLoading(true);

    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      setPasswordMsg(res.data?.message || 'Password updated! Please log in again with your new credentials.');
      setTimeout(() => {
        onLogout();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Failed to change password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setSuccess(null);
    setVerifyLoading(true);
    try {
      const res = await api.resendVerification({ email: user.email });
      setSuccess(res.data?.message || 'Verification token dispatched to your email.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend verification.');
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setVerifyLoading(true);
    try {
      const res = await api.verifyEmail({ token: verifyToken.trim() });
      setSuccess(res.data?.message || 'Email successfully verified in the clinical enclave!');
      setIsVerifyOpen(false);
      setVerifyToken('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Email verification failed.');
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center min-h-[calc(100vh-2rem)] py-12 px-4 relative overflow-hidden select-none">
      {/* Dynamic Ambient Clinical Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-container/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Authenticated Clinical Session Card */}
      <div className="relative w-full max-w-[540px] bg-surface-container-low/90 backdrop-blur-2xl rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col z-10 border border-surface-container-high/60">
        {/* Header with Brand & Role Badge */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-surface-container-highest">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center relative shadow-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Clinical Session Active</h2>
              <p className="text-[11px] text-outline">Enclave IDOR/BOLA Protected</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              user.role === 'DOCTOR'
                ? 'bg-secondary/15 text-secondary border border-secondary/30'
                : 'bg-primary/15 text-primary border border-primary/30'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {user.role === 'DOCTOR' ? 'stethoscope' : 'person'}
            </span>
            {user.role}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-primary-container/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Profile Card Summary */}
        <div className="bg-surface-container-lowest/80 rounded-lg p-4 mb-4 border border-outline-variant/30 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-outline">Account ID:</span>
            <span className="font-mono text-secondary text-[11px] bg-surface-container-high px-2 py-0.5 rounded">
              {user.id}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-outline">Verified Email:</span>
            <span className="text-on-surface font-medium">{user.email}</span>
          </div>

          {/* Email Verification Banner */}
          <div className="flex justify-between items-center text-xs pt-1 border-t border-surface-container-high/60">
            <span className="text-outline">Email Verification:</span>
            {user.isEmailVerified ? (
              <span className="text-primary font-semibold flex items-center gap-1 text-[11px]">
                <span className="material-symbols-outlined text-[14px]">verified</span> Verified
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-error font-medium text-[11px]">Unverified</span>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verifyLoading}
                  className="text-[10px] text-secondary hover:underline cursor-pointer"
                >
                  Resend Link
                </button>
                <button
                  type="button"
                  onClick={() => setIsVerifyOpen(true)}
                  className="text-[10px] text-primary hover:underline cursor-pointer"
                >
                  Enter Token
                </button>
              </div>
            )}
          </div>

          {user.patient && (
            <div className="mt-2 pt-2 border-t border-surface-container-high flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-outline">Patient Full Name:</span>
                <span className="text-primary font-semibold">{user.patient.name}</span>
              </div>
              {user.patient.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-outline">Contact:</span>
                  <span className="text-on-surface">{user.patient.phone}</span>
                </div>
              )}
            </div>
          )}

          {user.professional && (
            <div className="mt-2 pt-2 border-t border-surface-container-high flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-outline">Profession:</span>
                <span className="text-secondary font-semibold">{user.professional.profession}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline">Credential Status:</span>
                <span className="text-primary font-mono text-[11px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {user.professional.verificationStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Security & Dual-Mode Cookie Telemetry */}
        <div className="bg-surface-container-lowest/60 rounded-lg p-3.5 mb-4 border border-outline-variant/20 font-mono text-[11px] text-on-surface-variant flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-secondary font-bold text-xs">
            <span className="material-symbols-outlined text-[15px]">security</span>
            <span>Active Cryptographic Session Telemetry</span>
          </div>
          <div className="text-on-surface/90">
            • <strong className="text-primary">access_token:</strong> HttpOnly; SameSite=Strict (15m window)
          </div>
          <div className="text-on-surface/90">
            • <strong className="text-secondary">refresh_token:</strong> HttpOnly; Path=/api/auth/refresh (7d rotation)
          </div>
        </div>

        {/* Real Backend Action Buttons: Change Password & Sign Out */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full py-2.5 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-outline-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">password</span>
            <span>Change Security Password (POST /api/auth/change-password)</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2.5 px-4 rounded-lg border border-error/40 text-error hover:bg-error-container/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>{loggingOut ? 'Terminating Session...' : 'Sign Out (Clear Session Cookies)'}</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-container-low rounded-xl p-6 border border-surface-container-high shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">password</span>
                <h3 className="text-base font-semibold text-on-surface">Update Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setPasswordError(null);
                  setPasswordMsg(null);
                }}
                className="text-outline hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Updating your password immediately revokes all active refresh tokens across all sessions to prevent session hijacking.
            </p>

            {passwordError && (
              <div className="mb-3 p-2.5 rounded bg-error-container/20 border border-error/40 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{passwordError}</span>
              </div>
            )}

            {passwordMsg && (
              <div className="mb-3 p-2.5 rounded bg-primary-container/20 border border-primary/40 text-primary text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{passwordMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-on-surface-variant font-semibold block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-on-surface-variant font-semibold block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Strong Password (min 8 chars, 1 uppercase, 1 symbol)"
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all cursor-pointer disabled:opacity-50"
              >
                {passwordLoading ? 'Rotating Keys...' : 'Execute Password Change'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Token Verification Modal */}
      {isVerifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-container-low rounded-xl p-6 border border-surface-container-high shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">mark_email_read</span>
                <h3 className="text-base font-semibold text-on-surface">Submit Email Verification Token</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyOpen(false)}
                className="text-outline hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Paste the 64-character verification token dispatched to your inbox to execute <code className="text-secondary font-mono">POST /api/auth/verify-email</code>.
            </p>

            <form onSubmit={handleVerifyEmail} className="flex flex-col gap-3">
              <input
                type="text"
                required
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="64-character verification token"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs px-3.5 py-2.5 rounded-lg border border-outline-variant/30 focus:border-primary focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-all cursor-pointer disabled:opacity-50"
              >
                {verifyLoading ? 'Verifying Token...' : 'Verify Email Address'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
