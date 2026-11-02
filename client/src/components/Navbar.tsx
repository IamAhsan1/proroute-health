import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../api/client';
import { ThemeToggle } from './ThemeToggle';
import {
  Stethoscope,
  Search,
  Home,
  ShieldCheck,
  User,
  LogOut,
  Calendar,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Determine role-based workspace fast-travel target
  const getWorkspaceLink = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
      return { to: '/admin/verifications', label: 'Admin Console' };
    }
    if (currentUser.role === 'DOCTOR') {
      return { to: '/doctor/dashboard', label: 'Doctor Workspace' };
    }
    return { to: '/portal/dashboard', label: 'My Care Portal' };
  };

  const getHomeTarget = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'DOCTOR') return '/doctor/dashboard';
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') return '/admin/verifications';
    return '/';
  };

  const homeTarget = getHomeTarget();
  const workspace = getWorkspaceLink();

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-surface-container-highest transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to={homeTarget} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs transition-transform">
            <Stethoscope className="w-5 h-5 text-on-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-tight text-on-surface flex items-center gap-1.5 leading-none">
              ProRoute
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] tracking-wider text-outline uppercase mt-0.5">
              Healthcare Network
            </span>
          </div>
        </Link>

        {/* Public Consumer Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container-high/60 dark:bg-surface-container/60 p-1 rounded-xl border border-surface-container-highest text-xs font-medium">
          <Link
            to={homeTarget}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              isActive(homeTarget)
                ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            {currentUser?.role === 'DOCTOR' ? 'My Workspace' : currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? 'Admin Console' : 'Home'}
          </Link>

          <Link
            to="/doctors"
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              isActive('/doctors')
                ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Find Doctors
          </Link>

          <Link
            to="/doctors"
            className="px-3.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-all flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            Specialties
          </Link>
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Authenticated Workspace Launcher */}
              {workspace && (
                <Link
                  to={workspace.to}
                  className="px-3 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{workspace.label}</span>
                </Link>
              )}

              {/* User Identity & Logout */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-on-surface truncate max-w-[120px]">
                  {currentUser.patient?.name || currentUser.email.split('@')[0]}
                </span>
                <span className="text-[9px] font-mono tracking-wider text-outline uppercase">
                  {currentUser.role}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-error hover:bg-error/10 border border-error/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </Link>

              <Link
                to="/register"
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/20 transition-all"
              >
                Register
              </Link>

              <Link
                to="/doctors"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-fixed text-on-primary transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Doctor</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
