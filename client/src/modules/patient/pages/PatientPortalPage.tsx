import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../../api/client';
import { PatientMetricCards } from '../components/PatientMetricCards';

interface PatientPortalPageProps {
  currentUser: UserProfile | null;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ currentUser }) => {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      {/* Welcome & Security Banner */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>PMDC Verified Patient Enclave · End-to-End Encrypted</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-on-surface tracking-tight">
            Welcome back, {currentUser?.patient?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Patient')} <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your clinical consultations, private health vault records, and verified specialist care are synced and secure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container/85 border border-surface-container-highest px-4 py-2.5 rounded-xl shadow-sm text-xs font-mono">
            <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
            <span className="text-on-surface">
              Vault Status: <span className="text-primary font-bold">Encrypted & Online</span>
            </span>
          </div>
        </div>
      </section>

      {/* Quick Metric Cards */}
      <PatientMetricCards
        scheduledConsultsCount={0}
        activeRegimensCount={0}
        medicalRecordsCount={0}
      />

      {/* Main Actions & Discovery Hub */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">medical_services</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">Book Verified Medical Specialists</h3>
                <p className="text-xs text-on-surface-variant">Find board-certified practitioners across multiple clinical disciplines</p>
              </div>
            </div>
            <Link
              to="/doctors"
              className="py-2 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all font-mono"
            >
              Browse Directory
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-container-highest/50">
            <Link
              to="/doctors?specialty=cardiology"
              className="p-4 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/80 border border-outline-variant/30 transition-all flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-[24px] text-primary group-hover:scale-110 transition-transform">
                cardiology
              </span>
              <span className="text-xs font-bold text-on-surface">Cardiology</span>
              <span className="text-[11px] text-outline">Heart & vascular health</span>
            </Link>

            <Link
              to="/doctors?specialty=dermatology"
              className="p-4 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/80 border border-outline-variant/30 transition-all flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-[24px] text-secondary group-hover:scale-110 transition-transform">
                dermatology
              </span>
              <span className="text-xs font-bold text-on-surface">Dermatology</span>
              <span className="text-[11px] text-outline">Skin, hair & nail care</span>
            </Link>

            <Link
              to="/doctors?specialty=pediatrics"
              className="p-4 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/80 border border-outline-variant/30 transition-all flex flex-col gap-2 group"
            >
              <span className="material-symbols-outlined text-[24px] text-amber-400 group-hover:scale-110 transition-transform">
                child_care
              </span>
              <span className="text-xs font-bold text-on-surface">Pediatrics</span>
              <span className="text-[11px] text-outline">Child health & wellness</span>
            </Link>
          </div>
        </div>

        {/* Emergency Notice Card */}
        <div className="rounded-2xl bg-gradient-to-br from-error/15 via-surface-container/90 to-surface-container border border-error/30 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-error/20 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">emergency</span>
            </div>
            <h4 className="font-headline font-bold text-base text-on-surface">Emergency Care Notice</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              ProRoute is for scheduled and non-emergency telemedicine. If you are experiencing chest pain, severe shortness of breath, loss of consciousness, or acute trauma, seek immediate hospital emergency care.
            </p>
          </div>

          <div className="pt-4 border-t border-error/20 flex items-center justify-between font-mono text-xs text-error font-bold">
            <span>EMERGENCY HELPLINE</span>
            <span>911 / 1122</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientPortalPage;
