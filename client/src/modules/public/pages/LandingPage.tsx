import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  Zap,
  Lock,
  Star,
  Users,
  HeartPulse,
  Brain,
  Bone,
  Sparkles,
  Baby,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../../../api/client';

interface LandingPageProps {
  currentUser: UserProfile | null;
  onLogout?: () => void;
}

const FEATURED_SPECIALTIES = [
  { name: 'Cardiology', icon: HeartPulse, count: '14 Specialists', slug: 'cardiology', color: 'text-rose-600 dark:text-rose-500' },
  { name: 'Neurology', icon: Brain, count: '9 Specialists', slug: 'neurology', color: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Orthopedics', icon: Bone, count: '11 Specialists', slug: 'orthopedics', color: 'text-amber-600 dark:text-amber-500' },
  { name: 'Dermatology', icon: Sparkles, count: '16 Specialists', slug: 'dermatology', color: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Pediatrics', icon: Baby, count: '12 Specialists', slug: 'pediatrics', color: 'text-sky-600 dark:text-sky-400' },
  { name: 'General Medicine', icon: Stethoscope, count: '24 Specialists', slug: 'general-medicine', color: 'text-teal-600 dark:text-teal-400' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ currentUser }) => {
  const [symptomInput, setSymptomInput] = useState('');
  const navigate = useNavigate();

  const handleSymptomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (symptomInput.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(symptomInput.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  const setPrompt = (text: string) => {
    setSymptomInput(text);
  };

  return (
    <div className="w-full flex flex-col bg-background text-on-surface overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative w-full pt-10 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Authenticated Fast-Travel Workspace Banner */}
          {currentUser && (
            <div className="mb-8 inline-flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl bg-surface-container border border-surface-container-highest shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-on-surface">
                  Welcome back, <strong className="text-primary">{currentUser.patient?.name || currentUser.email.split('@')[0]}</strong>
                </span>
              </div>
              <Link
                to={
                  currentUser.role === 'DOCTOR'
                    ? '/doctor/dashboard'
                    : currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'
                    ? '/admin/verifications'
                    : '/doctors'
                }
                className="text-xs font-bold text-primary hover:underline"
              >
                <span>{currentUser.role === 'DOCTOR' ? 'My Doctor Workspace' : currentUser.role === 'ADMIN' ? 'Admin Console' : 'Find Specialists'}</span>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy & Symptom Search */}
            <div className="lg:col-span-7 flex flex-col gap-6 z-10 text-left">
              <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-surface-container-high border border-surface-container-highest shadow-xs">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-semibold tracking-wide uppercase text-on-surface">
                  Verified Healthcare Platform
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="text-xs font-semibold text-secondary">Zero Double-Booking</span>
              </div>

              <h1 className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.15] text-on-surface">
                Smarter Access. Verified Doctors.{' '}
                <span className="text-primary">
                  Better Care in Minutes.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Connect with board-certified medical specialists across certified clinical departments. Instant online appointment booking, verified PMDC licensure, and private telehealth consultations.
              </p>

              {/* Interactive Symptom Search & Triage Input */}
              <form onSubmit={handleSymptomSearch} className="w-full max-w-2xl mt-2 flex flex-col gap-2.5">
                <div className="p-1 rounded-2xl bg-surface-container border border-surface-container-highest shadow-sm">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-surface-container-lowest rounded-xl px-4 py-2 gap-3">
                    <div className="flex items-center gap-2 text-secondary shrink-0 pt-1 sm:pt-0">
                      <Stethoscope className="w-5 h-5 text-secondary" />
                    </div>
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      placeholder="Search condition or symptom (e.g. chest tightness, migraine)..."
                      className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none py-1.5"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs px-5 py-2.5 rounded-xl shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Find Doctors</span>
                    </button>
                  </div>
                </div>

                {/* Frequent Quick Prompt Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-outline font-semibold">
                    Common:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPrompt('Chest pain and palpitations')}
                    className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-secondary text-xs transition-colors"
                  >
                    Chest Pain
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt('Migraine and headache')}
                    className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-secondary text-xs transition-colors"
                  >
                    Migraine
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt('Skin rash and acne')}
                    className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-secondary text-xs transition-colors"
                  >
                    Skin Issues
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt('Pediatric fever')}
                    className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-secondary text-xs transition-colors"
                  >
                    Pediatric Care
                  </button>
                </div>
              </form>

              {/* Micro Metrics Banner */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-container-highest/60 max-w-2xl mt-2">
                <div>
                  <div className="flex items-center gap-1 font-headline font-bold text-xl sm:text-2xl text-on-surface">
                    <span>4.9</span>
                    <span className="text-secondary text-base">/5</span>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 ml-0.5" />
                  </div>
                  <span className="text-xs text-on-surface-variant">Doctor Trust Score</span>
                </div>
                <div>
                  <div className="font-headline font-bold text-xl sm:text-2xl text-on-surface">
                    100<span className="text-primary">%</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">PMDC Verified Roster</span>
                </div>
                <div>
                  <div className="font-headline font-bold text-xl sm:text-2xl text-secondary">
                    &lt; 15 <span className="text-xs text-on-surface">min</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">Average Booking Time</span>
                </div>
              </div>
            </div>

            {/* Right Clinical Showcase Card */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-surface-container backdrop-blur-2xl rounded-3xl border border-surface-container-highest p-6 sm:p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xl">
                      PR
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-base text-on-surface">Clinical Quality</h4>
                      <p className="text-[11px] text-outline">PMDC Verified Roster</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                    ● ACTIVE
                  </span>
                </div>

                {/* 3 Core Value Pillows */}
                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-highest flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-on-surface block">Guaranteed Appointments</span>
                      <span className="text-[11px] text-on-surface-variant font-sans">Real-time scheduling ensures your confirmed consultation slot is protected with zero double-booking.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-highest flex items-start gap-3">
                    <Lock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-on-surface block">Confidential Health Records</span>
                      <span className="text-[11px] text-on-surface-variant font-sans">Your medical files, diagnostic reports, and doctor chats remain strictly private and encrypted.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-highest flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-on-surface block">Verified Medical Specialists</span>
                      <span className="text-[11px] text-on-surface-variant font-sans">Every physician undergoes official PMDC license and credential review before listing.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/doctors"
                    className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs flex items-center justify-center shadow-sm transition-all cursor-pointer"
                  >
                    <span>Browse All Verified Doctors</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SPECIALTIES BENTO TAXONOMY */}
      <section className="w-full py-16 bg-surface-container-low/50 border-t border-surface-container-highest/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                Medical Specialties
              </span>
              <h2 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface mt-1">
                Explore Clinical Departments
              </h2>
            </div>
            <Link
              to="/doctors"
              className="text-xs font-semibold text-primary hover:underline"
            >
              <span>View Full Directory</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {FEATURED_SPECIALTIES.map((spec) => {
              const Icon = spec.icon;
              return (
                <Link
                  key={spec.slug}
                  to={`/doctors`}
                  className="p-5 rounded-2xl bg-surface-container/90 hover:bg-surface-container border border-surface-container-highest/80 hover:border-primary/50 shadow-md hover:-translate-y-1 transition-all flex flex-col gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${spec.color}`} />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {spec.name}
                    </h3>
                    <span className="text-[11px] text-outline font-mono block mt-0.5">
                      {spec.count}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. PATIENT & DOCTOR ONBOARDING DOCK */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Patient Card */}
          <div className="rounded-3xl bg-surface-container border border-surface-container-highest p-8 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-headline font-bold text-xl text-on-surface">For Healthcare Patients</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Receive prompt medical consultations from the privacy of your home. Consult via real-time messaging, review doctor credentials, and store medical lab reports securely.
              </p>
            </div>
            <Link
              to="/doctors"
              className="text-xs font-bold text-secondary hover:underline"
            >
              <span>Find a doctor and book slot</span>
            </Link>
          </div>

          {/* Practitioner Card */}
          <div className="rounded-3xl bg-surface-container border border-surface-container-highest p-8 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-xl text-on-surface">For Medical Practitioners</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Expand your clinical practice. Submit your PMDC license for fast accreditation, manage your weekly consultation windows, and conduct secure telehealth appointments.
              </p>
            </div>
            <Link
              to="/auth?role=doctor"
              className="text-xs font-bold text-primary hover:underline"
            >
              <span>Apply for Doctor Accreditation</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
