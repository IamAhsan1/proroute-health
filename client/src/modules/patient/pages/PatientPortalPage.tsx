import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../../api/client';
import { PatientMetricCards } from '../components/PatientMetricCards';
import {
  Lock,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Baby,
  AlertOctagon,
} from 'lucide-react';
import { Button } from '../../../components/ui';

interface PatientPortalPageProps {
  currentUser: UserProfile | null;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ currentUser }) => {
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      {/* Welcome & Security Banner */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Verified Patient Account · Encrypted & Confidential</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-on-surface tracking-tight">
            Welcome back, {currentUser?.patient?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Patient')}
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Your appointments, medical consultations, and health records are securely organized in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container/85 border border-surface-container-highest px-4 py-2.5 rounded-xl shadow-sm text-xs">
            <Lock className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-on-surface">
              Account Status: <span className="text-primary font-bold">Active & Secure</span>
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">Book Verified Medical Specialists</h3>
                <p className="text-xs text-on-surface-variant">Find board-certified practitioners across multiple clinical disciplines</p>
              </div>
            </div>
            <Link to="/doctors">
              <Button size="sm" className="font-mono text-xs font-semibold">
                Browse Directory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-container-highest/50">
            <Link
              to="/doctors?specialty=cardiology"
              className="p-4 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/80 border border-outline-variant/30 transition-all flex flex-col gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <HeartPulse className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-on-surface">Cardiology</span>
              <span className="text-[11px] text-outline">Heart & vascular health</span>
            </Link>

            <Link
              to="/doctors?specialty=dermatology"
              className="p-4 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/80 border border-outline-variant/30 transition-all flex flex-col gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary"
            >
              <Sparkles className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-on-surface">Dermatology</span>
              <span className="text-[11px] text-outline">Skin, hair & nail care</span>
            </Link>

            <Link
              to="/doctors?specialty=pediatrics"
              className="p-4 rounded-xl bg-surface-container-highest/40 hover:bg-surface-container-highest/80 border border-outline-variant/30 transition-all flex flex-col gap-2 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <Baby className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-on-surface">Pediatrics</span>
              <span className="text-[11px] text-outline">Child health & wellness</span>
            </Link>
          </div>
        </div>

        {/* Emergency Notice Card */}
        <div className="rounded-2xl bg-gradient-to-br from-error/15 via-surface-container/90 to-surface-container border border-error/30 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-error/20 text-error flex items-center justify-center">
              <AlertOctagon className="w-7 h-7 text-error" />
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
