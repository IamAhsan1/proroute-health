import React from 'react';
import { Link } from 'react-router-dom';

interface PatientMetricCardsProps {
  scheduledConsultsCount?: number;
  activeRegimensCount?: number;
  medicalRecordsCount?: number;
}

export const PatientMetricCards: React.FC<PatientMetricCardsProps> = ({
  scheduledConsultsCount = 0,
  activeRegimensCount = 0,
  medicalRecordsCount = 0,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1: Consultations */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-outline uppercase tracking-wider">Scheduled Consults</span>
            <span className="font-headline font-bold text-3xl text-on-surface mt-1">
              {scheduledConsultsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">calendar_month</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 flex items-center justify-between text-xs">
          <Link to="/doctors" className="text-primary hover:underline font-semibold flex items-center gap-1 font-mono">
            Book Specialist <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Stat 2: Active Prescriptions */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-secondary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-outline uppercase tracking-wider">Active Regimens</span>
            <span className="font-headline font-bold text-3xl text-on-surface mt-1">
              {activeRegimensCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">medication</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 text-xs font-mono text-outline">
          No active prescriptions
        </div>
      </div>

      {/* Stat 3: Vault Records */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-outline uppercase tracking-wider">Medical Records</span>
            <span className="font-headline font-bold text-3xl text-on-surface mt-1">
              {medicalRecordsCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">clinical_notes</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 text-xs font-mono text-outline">
          Encrypted Amazon S3 Storage
        </div>
      </div>

      {/* Stat 4: Account Security */}
      <div className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-5 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-outline uppercase tracking-wider">Security Enclave</span>
            <span className="font-headline font-bold text-xl text-primary mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]">shield</span>
              Active
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-surface-container-highest/50 text-xs font-mono text-outline">
          Continuous MFA Check
        </div>
      </div>
    </section>
  );
};
