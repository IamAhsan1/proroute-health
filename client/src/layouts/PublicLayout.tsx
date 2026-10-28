import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';
import { Navbar } from '../components/Navbar';

interface PublicLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Frosted-Glass Clinical Navigation */}
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Main Public Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Enterprise Clinical Platform Footer */}
      <footer className="w-full border-t border-surface-container-highest/60 bg-surface-container-lowest/90 backdrop-blur-xl py-12 px-6 sm:px-12 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">vital_signs</span>
              </div>
              <span className="font-headline font-black text-lg tracking-tight text-on-surface">
                ProRoute <span className="text-primary font-mono text-xs">HEALTH</span>
              </span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-sm">
              Production-oriented healthcare platform with concurrency-safe scheduling, verified doctor credentials, and cryptographic privacy guarantees.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-mono">
            <div className="flex flex-col gap-2">
              <span className="text-outline uppercase tracking-wider font-semibold">Discovery</span>
              <Link to="/doctors" className="text-on-surface-variant hover:text-primary transition-colors">
                Doctor Directory
              </Link>
              <Link to="/doctors" className="text-on-surface-variant hover:text-primary transition-colors">
                Clinical Specialties
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-outline uppercase tracking-wider font-semibold">Security</span>
              <span className="text-on-surface-variant">Argon2id Enclave</span>
              <span className="text-on-surface-variant">RFC 6819 Auth</span>
              <span className="text-on-surface-variant">Synthetic PHI</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-outline uppercase tracking-wider font-semibold">Portals</span>
              {currentUser?.role === 'DOCTOR' ? (
                <Link to="/doctor/profile" className="text-secondary hover:underline">
                  Doctor Workspace
                </Link>
              ) : currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? (
                <Link to="/admin/verifications" className="text-primary hover:underline">
                  Admin Portal
                </Link>
              ) : currentUser?.role === 'PATIENT' ? (
                <Link to="/portal/dashboard" className="text-secondary hover:underline">
                  Patient Hub
                </Link>
              ) : (
                <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors">
                  Account Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-surface-container-highest/40 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-outline font-mono gap-4">
          <span>© 2026 ProRoute Healthcare Systems · All rights reserved</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Clinical Core Monolith · Status: Operational
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
