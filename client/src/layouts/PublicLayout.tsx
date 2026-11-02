import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { UserProfile } from '../api/client';
import { Navbar } from '../components/Navbar';
import {
  Stethoscope,
  ShieldCheck,
  HeartPulse,
  Mail,
} from 'lucide-react';

interface PublicLayoutProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="w-full min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Clinical Navigation */}
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Main Public Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Professional Healthcare Footer */}
      <footer className="w-full border-t border-surface-container-highest bg-surface-container-lowest py-14 px-6 sm:px-12 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Brand & Mission (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
                <Stethoscope className="w-4 h-4 text-on-primary" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight text-on-surface">
                ProRoute <span className="text-primary text-xs font-semibold">HEALTH</span>
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
              ProRoute is a verified healthcare appointment network connecting patients with board-certified medical doctors. Instant online appointment booking and encrypted health record protection.
            </p>

            <div className="flex flex-col gap-1.5 text-xs text-outline mt-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>100% PMDC &amp; Regulatory Board Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-secondary shrink-0" />
                <span>HIPAA-Compliant Patient Telehealth</span>
              </div>
            </div>
          </div>

          {/* Column 2: For Patients (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3 text-xs">
            <span className="text-xs font-semibold text-on-surface">
              For Patients
            </span>
            <Link to="/doctors" className="text-on-surface-variant hover:text-primary transition-colors">
              Find Board-Certified Doctors
            </Link>
            <Link to="/doctors" className="text-on-surface-variant hover:text-primary transition-colors">
              Clinical Specialties Taxonomy
            </Link>
            <Link to="/doctors" className="text-on-surface-variant hover:text-primary transition-colors">
              Online Consultation Schedule
            </Link>
            {currentUser?.role === 'PATIENT' ? (
              <Link to="/portal/dashboard" className="text-secondary font-semibold hover:underline">
                My Patient Health Vault
              </Link>
            ) : (
              <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors">
                Patient Account Sign In
              </Link>
            )}
          </div>

          {/* Column 3: For Medical Practitioners (3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-3 text-xs">
            <span className="text-xs font-semibold text-on-surface">
              For Medical Practitioners
            </span>
            <Link to="/login?role=doctor" className="text-on-surface-variant hover:text-primary transition-colors">
              Doctor Credentialing &amp; Sign In
            </Link>
            <Link to="/register?role=doctor" className="text-on-surface-variant hover:text-primary transition-colors">
              Apply for PMDC Verification
            </Link>
            <span className="text-on-surface-variant/60 cursor-default">
              Clinical Scheduling Engine
            </span>
            {currentUser?.role === 'DOCTOR' && (
              <Link to="/doctor/dashboard" className="text-secondary font-semibold hover:underline">
                Doctor Practice Workspace
              </Link>
            )}
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
              <Link to="/admin/verifications" className="text-primary font-semibold hover:underline">
                Administrator Audit Console
              </Link>
            )}
          </div>

          {/* Column 4: Contact & Clinical Support (2 cols) */}
          <div className="md:col-span-2 flex flex-col gap-3 text-xs">
            <span className="text-xs font-semibold text-on-surface">
              Emergency &amp; Care
            </span>
            <p className="text-[11px] text-error/90 leading-normal">
              For life-threatening emergencies, please dial your local emergency services (1122/911) immediately.
            </p>
            <div className="flex items-center gap-1.5 text-on-surface-variant mt-1">
              <Mail className="w-3.5 h-3.5 text-outline" />
              <span>care@proroute.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="max-w-7xl mx-auto border-t border-surface-container-highest/50 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-outline gap-4">
          <span>© 2026 ProRoute Healthcare Systems. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="w-2 h-2 rounded-full bg-primary" />
              System Status: Operational
            </span>
            <span className="text-outline/40">•</span>
            <span>Synthetic Data Safe</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
