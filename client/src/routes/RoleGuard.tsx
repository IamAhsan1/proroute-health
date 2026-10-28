import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';

export interface RoleGuardProps {
  user: UserProfile | null;
  allowedRoles?: Array<'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN'>;
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ user, allowedRoles, children }) => {
  // 1. Unauthenticated gate: redirect to public root / auth
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Role authorization gate
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return (
      <main className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-lg bg-surface-container/90 border border-error/30 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-error/10 text-error border border-error/20 uppercase tracking-widest mb-3">
            Security Exception · 403 Forbidden
          </span>

          <h2 className="text-xl font-headline font-bold text-on-surface mb-2">
            Restricted Role Access
          </h2>

          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            Your current account role (<span className="text-primary font-mono font-semibold">{user.role}</span>) does not hold the cryptographic permissions required to access this workspace.
          </p>

          <div className="w-full p-4 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 text-left mb-6 font-mono text-xs flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-outline">Active Principal:</span>
              <span className="text-on-surface">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Assigned Role:</span>
              <span className="text-on-surface font-semibold">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Required Roles:</span>
              <span className="text-primary">{allowedRoles.join(' | ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <Link
              to="/"
              className="flex-1 py-3 px-4 rounded-xl bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface text-sm font-semibold transition-all text-center"
            >
              Back to Home
            </Link>
            {user.role === 'DOCTOR' && (
              <Link
                to="/doctor/profile"
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all text-center"
              >
                Doctor Portal
              </Link>
            )}
            {user.role === 'PATIENT' && (
              <Link
                to="/portal/dashboard"
                className="flex-1 py-3 px-4 rounded-xl bg-secondary text-on-secondary text-sm font-semibold hover:bg-secondary/90 transition-all text-center"
              >
                Patient Portal
              </Link>
            )}
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <Link
                to="/admin/verifications"
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-all text-center"
              >
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  // 3. Authorized access granted
  return children ? <>{children}</> : <Outlet />;
};

export default RoleGuard;

