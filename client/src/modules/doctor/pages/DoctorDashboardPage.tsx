import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doctorService, DoctorProfile } from '../../../services/doctor.service';
import { UserProfile } from '../../../api/client';
import {
  BadgeCheck,
  CalendarClock,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface DoctorDashboardPageProps {
  currentUser: UserProfile | null;
}

export const DoctorDashboardPage: React.FC<DoctorDashboardPageProps> = ({ currentUser }) => {
  // Fetch doctor profile to check verification status and credentials
  const { data: profile } = useQuery<DoctorProfile>({
    queryKey: ['myDoctorProfile'],
    queryFn: doctorService.getMyDoctorProfile,
    enabled: !!currentUser && currentUser.role === 'DOCTOR',
    retry: false,
  });

  const doctorName = currentUser?.email
    ? `Dr. ${currentUser.email.split('@')[0]}`
    : 'Dr. Practitioner';

  const verificationStatus = profile?.verificationStatus || 'NOT_SUBMITTED';
  const isApproved = verificationStatus === 'APPROVED';
  const isPending = verificationStatus === 'PENDING';
  const isRejected = verificationStatus === 'REJECTED';
  const isNotSubmitted = verificationStatus === 'NOT_SUBMITTED';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Welcome & Clinical Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-surface-container-highest/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Doctor Workspace
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              Verified Practitioner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
            Welcome back, {doctorName}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {profile?.specialty?.name
              ? `${profile.specialty.name} Specialist • ${profile.yearsOfExperience || 5} years clinical experience`
              : 'Medical Specialist Workspace • Real-time clinical scheduling & patient care.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/doctors"
            className="text-xs px-3.5 py-2 rounded-xl border border-surface-container-highest bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-medium transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Public Directory</span>
          </Link>
          <Link
            to="/doctor/schedule"
            className="text-xs px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-semibold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Manage Schedule</span>
          </Link>
        </div>
      </div>

      {/* 2. Verification Status Alert Callout */}
      {isNotSubmitted && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Action Required: Submit Your Medical Credentials
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Your medical profile is incomplete. Submit your PMDC license number, specialty, and clinical bio so our administration can verify and activate your profile in the public patient directory.
              </p>
            </div>
          </div>
          <Link
            to="/doctor/profile"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center justify-center shadow-sm"
          >
            <span>Complete Credentials</span>
          </Link>
        </div>
      )}

      {isPending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                Medical Credentials Under Review
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Your PMDC credentials have been securely submitted and are currently awaiting administrative review. Once approved, your profile will immediately become bookable by patients.
              </p>
            </div>
          </div>
          <Link
            to="/doctor/profile"
            className="px-4 py-2 rounded-xl border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 font-semibold text-xs shrink-0 transition-colors flex items-center justify-center"
          >
            <span>Review Submission</span>
          </Link>
        </div>
      )}

      {isRejected && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                Verification Re-Submission Required
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {profile?.rejectionReason
                  ? `Administrative note: "${profile.rejectionReason}". Please update your credentials.`
                  : 'Your credentials could not be verified by the clinical review board. Please update your license details.'}
              </p>
            </div>
          </div>
          <Link
            to="/doctor/profile"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 transition-colors flex items-center justify-center"
          >
            <span>Update Credentials</span>
          </Link>
        </div>
      )}

      {isApproved && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                PMDC Verified Practitioner
              </span>
              <p className="text-xs text-on-surface-variant">
                Your medical license ({profile?.licenseNumber || 'PMDC-Verified'}) is approved and live in patient searches.
              </p>
            </div>
          </div>
          <Link
            to="/doctor/profile"
            className="text-xs text-primary hover:underline font-semibold flex items-center shrink-0"
          >
            <span>Edit Profile</span>
          </Link>
        </div>
      )}

      {/* 3. Operational KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Verification Status */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Credential Status</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface capitalize">
              {verificationStatus === 'NOT_SUBMITTED' ? 'Incomplete' : verificationStatus.toLowerCase()}
            </span>
            <p className="text-[11px] text-outline mt-0.5">
              {isApproved ? 'Active in public directory' : 'Under administrative review'}
            </p>
          </div>
        </div>

        {/* Metric 2: Consultation Fee */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Consultation Fee</span>
            <DollarSign className="w-4 h-4 text-secondary" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">
              {profile?.consultationFee ? `$${profile.consultationFee}` : '$45 (Default)'}
            </span>
            <p className="text-[11px] text-outline mt-0.5">Per consultation session</p>
          </div>
        </div>

        {/* Metric 3: Weekly Schedule */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Weekly Schedule</span>
            <CalendarClock className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">Standard Hours</span>
            <p className="text-[11px] text-outline mt-0.5">Recurring weekly shifts</p>
          </div>
        </div>

        {/* Metric 4: Patient Consultations */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Today's Queue</span>
            <Calendar className="w-4 h-4 text-outline" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">0 Consultations</span>
            <p className="text-[11px] text-outline mt-0.5">No pending appointments</p>
          </div>
        </div>
      </div>

      {/* 4. Quick Action Hub (Modular Core Features) */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Availability Schedule Builder */}
          <Link
            to="/doctor/schedule"
            className="group p-5 rounded-2xl bg-surface-container border border-surface-container-highest hover:border-primary/50 transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CalendarClock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                  Availability Schedule
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Configure your weekly operating hours, split shifts, consultation durations (15–60 min), and date-specific vacation blackouts.
              </p>
            </div>
            <div className="text-xs font-semibold text-primary">
              <span>Open Schedule Manager</span>
            </div>
          </Link>

          {/* Card 2: Medical Credentials & Licensure */}
          <Link
            to="/doctor/profile"
            className="group p-5 rounded-2xl bg-surface-container border border-surface-container-highest hover:border-primary/50 transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BadgeCheck className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors">
                  Medical Credentials
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Manage your PMDC license number, clinical specialty department, consultation fees, experience, and professional bio.
              </p>
            </div>
            <div className="text-xs font-semibold text-secondary">
              <span>Manage Credentials & Bio</span>
            </div>
          </Link>

          {/* Card 3: Consultation Queue */}
          <Link
            to="/doctor/appointments"
            className="group p-5 rounded-2xl bg-surface-container border border-surface-container-highest hover:border-outline transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-outline flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 text-outline" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-on-surface transition-colors">
                  Consultation Queue
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Review upcoming patient appointments, telehealth intake summaries, and automated booking notifications.
              </p>
            </div>
            <div className="text-xs font-semibold text-outline">
              <span>View Appointment Queue</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
