import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../api/client';

interface NavbarProps {
  currentUser: UserProfile | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container/85 backdrop-blur-xl border-b border-surface-container-highest/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-container via-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-surface-container-lowest text-[22px] font-bold">
              vital_signs
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-tight text-on-surface flex items-center gap-1">
              ProRoute
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            </span>
            <span className="text-[10px] font-mono tracking-wider text-outline uppercase -mt-1">
              Clinical Platform
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container-low/90 p-1 rounded-xl border border-surface-container-highest/50">
          <Link
            to="/doctors"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              isActive('/doctors')
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">medical_services</span>
            Find Doctors
          </Link>

          {/* Patient Portal Link */}
          {currentUser?.role === 'PATIENT' && (
            <Link
              to="/portal/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive('/portal/dashboard')
                  ? 'bg-secondary/15 text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">home_health</span>
              Patient Portal
            </Link>
          )}

          {/* Doctor Portal Link */}
          {(currentUser?.role === 'DOCTOR' || !currentUser) && (
            <Link
              to="/doctor/profile"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive('/doctor/profile')
                  ? 'bg-secondary/15 text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              Doctor Workspace
            </Link>
          )}

          {/* Admin Verification Portal Link */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || !currentUser) && (
            <Link
              to="/admin/verifications"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive('/admin/verifications')
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              Admin Control
            </Link>
          )}
        </nav>

        {/* User Status & Action */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-on-surface truncate max-w-[140px]">
                  {currentUser.email}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-primary uppercase">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-error hover:bg-error/10 border border-error/30 transition-colors flex items-center gap-1"
                title="Sign out of clinical enclave"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-primary-fixed transition-colors shadow-md shadow-primary/20 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
