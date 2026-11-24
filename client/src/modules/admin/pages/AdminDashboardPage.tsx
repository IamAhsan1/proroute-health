import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '../../../api/client';
import { doctorService } from '../../../services/doctor.service';
import { specialtyService } from '../../../services/specialty.service';
import {
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  Stethoscope,
  Activity,
  CreditCard,
  History,
  Search,
  Users,
  Lock,
  Crown,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface AdminDashboardPageProps {
  currentUser: UserProfile | null;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAuthorized = currentUser?.role === 'ADMIN' || isSuperAdmin;

  // 1. Live Pending Doctor Verifications Queue Count
  const { data: pendingData } = useQuery({
    queryKey: ['pendingDoctors'],
    queryFn: () => doctorService.getPendingDoctors(1, 50),
    enabled: !!currentUser && isAuthorized,
    staleTime: 1000 * 30,
  });

  // 2. Live Specialties Directory Stats
  const { data: specialtiesData } = useQuery({
    queryKey: ['adminSpecialties'],
    queryFn: () => specialtyService.getAllAdminSpecialties(),
    enabled: !!currentUser && isAuthorized,
    staleTime: 1000 * 60,
  });

  // 3. Live Approved Doctors Count
  const { data: approvedData } = useQuery({
    queryKey: ['approvedDoctors', 'overview-count'],
    queryFn: () => doctorService.getPublicDoctors({ page: 1, limit: 1 }),
    enabled: !!currentUser && isAuthorized,
    staleTime: 1000 * 60,
  });

  const pendingCount =
    pendingData?.pagination?.total ?? pendingData?.pendingDoctors?.length ?? 0;
  const totalSpecialties = specialtiesData?.length ?? 0;
  const activeSpecialties = specialtiesData?.filter((s) => s.isActive).length ?? 0;
  const approvedDoctorsCount = approvedData?.pagination?.total ?? 0;

  const adminDisplayName = currentUser?.email
    ? currentUser.email.split('@')[0]
    : isSuperAdmin
    ? 'Super Administrator'
    : 'Administrator';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Welcome & Role-Aware Governance Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-surface-container-highest/60">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              {isSuperAdmin ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  Super Admin Governance
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Admin Operations Console
                </>
              )}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                isSuperAdmin
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}
            >
              {isSuperAdmin ? 'Root Privilege • Full System Access' : 'Clinical Operations Role'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
            Welcome back, {adminDisplayName}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {isSuperAdmin
              ? 'Platform-Wide Governance • Medical credentialing, financial payouts, regulatory audit logs & system security.'
              : 'Clinical Operations Workspace • Physician licensure verification, specialty taxonomy & booking oversight.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/doctors"
            className="text-xs px-3.5 py-2 rounded-xl border border-surface-container-highest bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-medium transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Public Directory</span>
          </Link>
          {isSuperAdmin && (
            <Link
              to="/admin/audit"
              className="text-xs px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </Link>
          )}
          <Link
            to="/admin/verifications"
            className="text-xs px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-semibold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Review Queue ({pendingCount})</span>
          </Link>
        </div>
      </div>

      {/* 2. Role Notice / Pending Queue Banner */}
      {pendingCount > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {pendingCount} Doctor Verification{pendingCount > 1 ? 's' : ''} Awaiting Review
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Submitted PMDC/medical board credentials require manual audit before doctors become bookable in the public directory.
              </p>
            </div>
          </div>
          <Link
            to="/admin/verifications"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Open Verification Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                Verification Queue Clear
              </span>
              <p className="text-xs text-on-surface-variant">
                All submitted doctor licensure applications have been processed.
              </p>
            </div>
          </div>
          <Link
            to="/admin/specialties"
            className="text-xs text-primary hover:underline font-semibold flex items-center shrink-0"
          >
            <span>Manage Specialties</span>
          </Link>
        </div>
      )}

      {/* 3. Live Operational KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Verifications */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Pending Verifications</span>
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">
              {pendingCount} {pendingCount === 1 ? 'Doctor' : 'Doctors'}
            </span>
            <p className="text-[11px] text-outline mt-0.5">
              {pendingCount > 0 ? 'Awaiting licensure approval' : 'Queue up to date'}
            </p>
          </div>
        </div>

        {/* Metric 2: Verified Doctors */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Verified Physicians</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">
              {approvedDoctorsCount} Active
            </span>
            <p className="text-[11px] text-outline mt-0.5">Live in public directory</p>
          </div>
        </div>

        {/* Metric 3: Medical Specialties */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Clinical Specialties</span>
            <Stethoscope className="w-4 h-4 text-secondary" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">
              {activeSpecialties} / {totalSpecialties}
            </span>
            <p className="text-[11px] text-outline mt-0.5">Active clinical departments</p>
          </div>
        </div>

        {/* Metric 4: Role Privilege Tier */}
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-highest flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">Authority Tier</span>
            {isSuperAdmin ? (
              <Crown className="w-4 h-4 text-amber-500" />
            ) : (
              <Lock className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-headline text-on-surface">
              {isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN'}
            </span>
            <p className="text-[11px] text-outline mt-0.5">
              {isSuperAdmin
                ? 'Financials, Audit Logs & Root RBAC'
                : 'Credentialing, Specialties & Bookings'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Clinical Operations Hub (Shared by ADMIN & SUPER_ADMIN) */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
          Clinical Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Verification Queue */}
          <Link
            to="/admin/verifications"
            className="group p-5 rounded-2xl bg-surface-container border border-surface-container-highest hover:border-primary/50 transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                  Doctor Verification Queue
                </h3>
                {pendingCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Audit submitted medical licenses, PMDC numbers, and clinical documents before approving doctors for public booking.
              </p>
            </div>
            <div className="text-xs font-semibold text-primary">
              <span>Open Verification Queue</span>
            </div>
          </Link>

          {/* Card 2: Medical Specialties */}
          <Link
            to="/admin/specialties"
            className="group p-5 rounded-2xl bg-surface-container border border-surface-container-highest hover:border-secondary/50 transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-base font-bold text-on-surface group-hover:text-secondary transition-colors">
                Medical Specialties
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Create, update, and activate standardized medical departments used across doctor onboarding and AI specialist routing.
              </p>
            </div>
            <div className="text-xs font-semibold text-secondary">
              <span>Manage Specialties Directory</span>
            </div>
          </Link>

          {/* Card 3: Bookings & Appointments */}
          <Link
            to="/admin/bookings"
            className="group p-5 rounded-2xl bg-surface-container border border-surface-container-highest hover:border-outline transition-all flex flex-col justify-between gap-4 shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high text-outline flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-outline" />
              </div>
              <h3 className="text-base font-bold text-on-surface">
                Bookings &amp; Appointments
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Monitor platform-wide consultation activity, slot hold expirations, cancellation policies, and scheduling conflicts.
              </p>
            </div>
            <div className="text-xs font-semibold text-outline">
              <span>View Booking Oversight</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Role-Restricted Governance Hub */}
      {isSuperAdmin ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Super Admin Governance &amp; Security
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              SUPER_ADMIN ONLY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Super Admin Card 1: Payment Settlements */}
            <Link
              to="/admin/payments"
              className="group p-5 rounded-2xl bg-surface-container border border-amber-500/25 hover:border-amber-500/60 transition-all flex flex-col justify-between gap-4 shadow-xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-on-surface group-hover:text-amber-500 transition-colors">
                  Financials &amp; Payout Ledger
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Oversee escrow settlements, doctor payout disbursements, platform fee splits, and refund reconciliation.
                </p>
              </div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Open Payment Settlements</span>
              </div>
            </Link>

            {/* Super Admin Card 2: Compliance & Audit Logs */}
            <Link
              to="/admin/audit"
              className="group p-5 rounded-2xl bg-surface-container border border-amber-500/25 hover:border-amber-500/60 transition-all flex flex-col justify-between gap-4 shadow-xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <History className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-on-surface group-hover:text-amber-500 transition-colors">
                  Compliance &amp; Security Audit Logs
                </h3>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Inspect immutable administrative audit trails, role escalations, licensure approvals, and PHI access telemetry.
                </p>
              </div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Open Compliance Logs</span>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-surface-container/60 border border-surface-container-highest flex items-center gap-3 text-xs text-on-surface-variant">
          <ShieldAlert className="w-4 h-4 text-outline shrink-0" />
          <span>
            Financial settlements and system-wide compliance audit logs are restricted to <strong className="text-on-surface">SUPER_ADMIN</strong> governance accounts.
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

