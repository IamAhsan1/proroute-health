import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';

interface PatientLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col md:flex-row selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Patient Telehealth Portal Sidebar */}
      <aside className="w-full md:w-72 bg-surface-container-lowest border-r border-surface-container-highest/60 flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-surface-container-highest/50 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-md">
                <span className="material-symbols-outlined text-[20px]">healing</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-black text-sm tracking-tight text-on-surface">
                  ProRoute
                </span>
                <span className="text-[10px] font-mono text-secondary font-semibold uppercase tracking-wider">
                  Patient Health Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Patient Card */}
          <div className="p-5 border-b border-surface-container-highest/40 bg-surface-container/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary border border-secondary/30 flex items-center justify-center font-headline font-bold text-base shadow-inner">
                {currentUser?.patient?.name
                  ? currentUser.patient.name.charAt(0).toUpperCase()
                  : currentUser?.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : 'P'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface truncate">
                  {currentUser?.patient?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Patient')}
                </span>
                <span className="text-[11px] font-mono text-outline truncate">
                  {currentUser?.email}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-secondary/15 text-secondary border border-secondary/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Verified Patient Account
              </span>
            </div>
          </div>

          {/* Patient Navigation */}
          <nav className="p-4 flex flex-col gap-1.5">
            <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-outline font-semibold">
              Telehealth Services
            </span>

            <NavLink
              to="/portal/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-secondary/15 text-secondary border border-secondary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">home_health</span>
              Portal Overview
            </NavLink>

            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-secondary/15 text-secondary border border-secondary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">medical_services</span>
              Find & Book Doctors
            </NavLink>

            <NavLink
              to="/portal/appointments"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-secondary/15 text-secondary border border-secondary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              My Consultations
              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                Phase 4
              </span>
            </NavLink>

            <NavLink
              to="/portal/records"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-secondary/15 text-secondary border border-secondary/30 font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
              Medical Records Vault
              <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                Phase 6
              </span>
            </NavLink>
          </nav>
        </div>

        {/* Patient Footer */}
        <div className="p-4 border-t border-surface-container-highest/50 flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 text-[11px] text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">encrypted</span>
            <span>Private S3 Health Vault Encrypted</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-surface-container-highest hover:bg-error/15 hover:text-error text-on-surface-variant text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Patient Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-6 border-b border-surface-container-highest/50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-outline">
            <span>Patient Portal</span>
            <span>/</span>
            <span className="text-secondary font-semibold">Telehealth Overview</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">emergency</span>
              Emergency: Call 911 immediately
            </span>

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

export default PatientLayout;
