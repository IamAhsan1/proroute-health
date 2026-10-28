import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';

interface AdminLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col md:flex-row selection:bg-primary-container selection:text-on-primary-container">
      {/* Administrative Operations Sidebar */}
      <aside className="w-full md:w-72 bg-surface-container-lowest border-r border-surface-container-highest/60 flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-surface-container-highest/50 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-md">
                <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-black text-sm tracking-tight text-on-surface">
                  ProRoute
                </span>
                <span className="text-[10px] font-mono text-primary font-semibold uppercase tracking-wider">
                  Admin Control Center
                </span>
              </div>
            </Link>
          </div>

          {/* Admin User Card */}
          <div className="p-5 border-b border-surface-container-highest/40 bg-surface-container/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-headline font-bold text-base shadow-inner">
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface truncate">
                  {currentUser?.email ? currentUser.email.split('@')[0] : 'Administrator'}
                </span>
                <span className="text-[11px] font-mono text-outline truncate">
                  {currentUser?.email}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-primary/15 text-primary border border-primary/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Root Audit Clearance
              </span>
            </div>
          </div>

          {/* Admin Navigation */}
          <nav className="p-4 flex flex-col gap-1.5">
            <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-outline font-semibold">
              Platform Governance
            </span>

            <NavLink
              to="/admin/verifications"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              Doctor Approvals Queue
            </NavLink>

            <NavLink
              to="/admin/specialties"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">category</span>
              Specialties Taxonomy
              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                Active
              </span>
            </NavLink>

            <NavLink
              to="/admin/audits"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">shield</span>
              Security Audit Logs
              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                Phase 10
              </span>
            </NavLink>

            <div className="my-3 border-t border-surface-container-highest/40" />

            <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-outline font-semibold">
              Public Interface
            </span>

            <Link
              to="/doctors"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Live Doctor Directory
            </Link>
          </nav>
        </div>

        {/* Admin Footer & Logout */}
        <div className="p-4 border-t border-surface-container-highest/50 flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-[11px] text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">security</span>
            <span>Zero-Trust Admin Session Active</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-container-highest hover:bg-error/15 hover:text-error text-on-surface-variant text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            End Admin Session
          </button>
        </div>
      </aside>

      {/* Main Admin Content Outlet */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-6 border-b border-surface-container-highest/50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-outline">
            <span>Governance</span>
            <span>/</span>
            <span className="text-primary font-semibold">Administrative Operations</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1 font-mono"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Home
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
