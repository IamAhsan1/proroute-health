import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from './api/client';
import { AuthEnclave } from './components/AuthEnclave';
import { RoleGuard } from './routes/RoleGuard';
import { PublicLayout } from './layouts/PublicLayout';
import { DoctorLayout } from './layouts/DoctorLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { PatientLayout } from './layouts/PatientLayout';
import { DoctorDirectoryPage } from './modules/public';
import { LandingPage } from './modules/public/pages/LandingPage';
import { ThemePreviewPage } from './modules/public/pages/ThemePreviewPage';
import { DoctorDashboardPage, DoctorProfilePage } from './modules/doctor';
import { AdminVerificationsPage, AdminSpecialtiesPage } from './modules/admin';
import { PatientPortalPage } from './modules/patient';
import { VerifyEmailPage, ResetPasswordPage } from './modules/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlannedFeaturePage } from './components/PlannedFeaturePage';
import {
  CalendarClock,
  Calendar,
  FileText,
  MessageSquare,
  Activity,
  CreditCard,
  History,
} from 'lucide-react';

export const App: React.FC = () => {
  const queryClient = useQueryClient();

  // Manage user session seamlessly with TanStack Query
  const { data: currentUser, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const res = await api.getMe();
        return res.data || null;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    retry: false,
  });

  // Listen for session expiry from Axios response interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.setQueryData(['currentUser'], null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [queryClient]);

  const handleAuthSuccess = (user: UserProfile) => {
    queryClient.setQueryData(['currentUser'], user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout to ensure client resets
    } finally {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      queryClient.removeQueries({ queryKey: ['myDoctorProfile'] });
    }
  };

  if (isLoading) {
    return (
      <main className="w-full min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center relative shadow-lg">
            <span className="material-symbols-outlined text-primary text-[24px] animate-pulse">
              vital_signs
            </span>
          </div>
          <p className="text-xs font-mono text-outline animate-pulse">
            Loading ProRoute Healthcare...
          </p>
        </div>
      </main>
    );
  }

  const user = currentUser ?? null;

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public & Guest Routes (Shared PublicLayout with frosted header & footer) */}
        <Route element={<PublicLayout currentUser={user} onLogout={handleLogout} />}>
          <Route
            path="/"
            element={
              user?.role === 'DOCTOR' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
                <Navigate to="/admin/verifications" replace />
              ) : (
                <LandingPage currentUser={user} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/auth"
            element={
              <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-8 px-4">
                <AuthEnclave currentUser={user} onSuccess={handleAuthSuccess} />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-8 px-4">
                <AuthEnclave currentUser={user} initialMode="signin" onSuccess={handleAuthSuccess} />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-8 px-4">
                <AuthEnclave currentUser={user} initialMode="signup" onSuccess={handleAuthSuccess} />
              </div>
            }
          />
          <Route path="/doctors" element={<DoctorDirectoryPage />} />
          <Route path="/theme-preview" element={<ThemePreviewPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage currentUser={user} />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* 2. Doctor Clinical Workspace (Role-Protected for DOCTOR) */}
        <Route
          element={
            <RoleGuard user={user} allowedRoles={['DOCTOR']}>
              <DoctorLayout currentUser={user} onLogout={handleLogout} />
            </RoleGuard>
          }
        >
          <Route path="/doctor" element={<DoctorDashboardPage currentUser={user} />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboardPage currentUser={user} />} />
          <Route path="/doctor/profile" element={<DoctorProfilePage currentUser={user} />} />
          <Route
            path="/doctor/schedule"
            element={
              <PlannedFeaturePage
                title="Availability Schedule Builder"
                category="Doctor Scheduling Engine"
                description="Manage weekly recurring availability windows, date-specific custom overrides, slot duration parameters, and buffer times."
                plannedFeatures={[
                  'Day-of-week recurrence templates (Monday to Sunday)',
                  'Custom date overrides (vacations, holidays, emergency blocks)',
                  'Dynamic slot generator with 15/30/45/60 min granularity',
                  'Real-time double-booking prevention',
                ]}
                backPath="/doctor/dashboard"
                backLabel="Dashboard"
                icon={CalendarClock}
                badgeVariant="doctor"
              />
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <PlannedFeaturePage
                title="Patient Consultation Queue"
                category="Clinical Operations"
                description="Track upcoming appointments, confirm or reschedule requests, and manage patient consultation statuses."
                plannedFeatures={[
                  'Live consultation queue with status transitions',
                  'One-click appointment confirmation & reschedule protocol',
                  'Patient medical intake summary preview',
                  'Automated appointment notifications and reminders',
                ]}
                backPath="/doctor/dashboard"
                backLabel="Dashboard"
                icon={Calendar}
                badgeVariant="doctor"
              />
            }
          />
          <Route
            path="/doctor/documents"
            element={
              <PlannedFeaturePage
                title="Patient Records & Medical Files"
                category="Medical Records & Imaging"
                description="Securely access patient-shared lab results, clinical history, and upload signed digital prescriptions."
                plannedFeatures={[
                  'Private cloud storage for medical records',
                  'Doctor-patient confidential access controls',
                  'High-resolution PDF and medical imagery viewer',
                  'Complete access history for patient privacy compliance',
                ]}
                backPath="/doctor/dashboard"
                backLabel="Dashboard"
                icon={FileText}
                badgeVariant="doctor"
              />
            }
          />
          <Route
            path="/doctor/chat"
            element={
              <PlannedFeaturePage
                title="Live Telehealth Consultations"
                category="Realtime Communication"
                description="Real-time doctor-patient text consultation channel with active session guards and chat history."
                plannedFeatures={[
                  'Secure real-time encrypted messaging channel',
                  'Active consultation window access control',
                  'Live typing indicators and delivery receipts',
                  'Session transcript export into medical records',
                ]}
                backPath="/doctor/dashboard"
                backLabel="Dashboard"
                icon={MessageSquare}
                badgeVariant="doctor"
              />
            }
          />
        </Route>

        {/* 3. Administrative Operations Portal (Role-Protected for ADMIN & SUPER_ADMIN) */}
        <Route
          element={
            <RoleGuard user={user} allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <ErrorBoundary fallbackTitle="Admin Portal Error">
                <AdminLayout currentUser={user} onLogout={handleLogout} />
              </ErrorBoundary>
            </RoleGuard>
          }
        >
          <Route
            path="/admin/verifications"
            element={
              <ErrorBoundary fallbackTitle="Verification Queue Error">
                <AdminVerificationsPage currentUser={user} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/specialties"
            element={
              <ErrorBoundary fallbackTitle="Specialties Error">
                <AdminSpecialtiesPage currentUser={user} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <PlannedFeaturePage
                title="Platform Booking Oversight"
                category="Administrative Governance"
                description="Comprehensive visibility across all platform bookings, slot states, cancellation rates, and dispute arbitrations."
                plannedFeatures={[
                  'Cross-platform booking search with doctor/patient filters',
                  'Conflict arbitration and administrative slot override',
                  'Cancellation trend analytics and platform load metrics',
                  'Automated refund triggers on disputed cancellations',
                ]}
                backPath="/admin/verifications"
                backLabel="Verifications"
                icon={Activity}
                badgeVariant="admin"
              />
            }
          />
          <Route
            path="/admin/payments"
            element={
              <PlannedFeaturePage
                title="Financials & Payout Ledger"
                category="Platform Economics"
                description="Payment processing, commission splitting, doctor escrow payouts, and financial transaction history."
                plannedFeatures={[
                  'Escrow settlement and doctor payout disbursements',
                  'Platform fee deductions and commission reporting',
                  'Instant refund issuance for cancelled appointments',
                  'Exportable tax-compliant reconciliation ledger',
                ]}
                backPath="/admin/verifications"
                backLabel="Verifications"
                icon={CreditCard}
                badgeVariant="admin"
              />
            }
          />
          <Route
            path="/admin/audit"
            element={
              <PlannedFeaturePage
                title="Compliance & Activity Audit Logs"
                category="Regulatory & Clinical Compliance"
                description="Official logs of doctor verifications, patient record access, and administrative actions for healthcare compliance."
                plannedFeatures={[
                  'Protected and permanent audit records',
                  'Doctor verifications and administrative change logs',
                  'Secure timestamps and session access history',
                  'Automated security monitoring and compliance reports',
                ]}
                backPath="/admin/verifications"
                backLabel="Verifications"
                icon={History}
                badgeVariant="admin"
              />
            }
          />
        </Route>

        {/* 4. Patient Telehealth Portal (Role-Protected for PATIENT) */}
        <Route
          element={
            <RoleGuard user={user} allowedRoles={['PATIENT']}>
              <PatientLayout currentUser={user} onLogout={handleLogout} />
            </RoleGuard>
          }
        >
          <Route path="/portal/dashboard" element={<PatientPortalPage currentUser={user} />} />
          <Route
            path="/portal/appointments"
            element={
              <PlannedFeaturePage
                title="My Scheduled Consultations"
                category="Patient Care"
                description="View your confirmed and upcoming doctor consultations, reschedule slots, or request cancellations."
                plannedFeatures={[
                  'Upcoming and past consultation timeline',
                  'Add to Google / Apple Calendar sync',
                  'Pre-appointment intake questionnaire review',
                  'Direct telehealth room launch upon consultation time',
                ]}
                backPath="/portal/dashboard"
                backLabel="Dashboard"
                icon={Calendar}
                badgeVariant="patient"
              />
            }
          />
          <Route
            path="/portal/records"
            element={
              <PlannedFeaturePage
                title="Medical Records & Documents"
                category="Private Health Information"
                description="Upload and organize your lab reports, prescriptions, and test results with secure temporary doctor access."
                plannedFeatures={[
                  'Secure medical file uploads (PDF, scans, test reports)',
                  'Share records with your doctor for scheduled visits',
                  'Revoke document access anytime with 1 click',
                  'Download your complete medical history archive',
                ]}
                backPath="/portal/dashboard"
                backLabel="Dashboard"
                icon={FileText}
                badgeVariant="patient"
              />
            }
          />
          <Route
            path="/portal/messages"
            element={
              <PlannedFeaturePage
                title="Doctor Messages"
                category="Direct Care Channel"
                description="Communicate directly with your confirmed doctors regarding prescriptions, symptoms, and follow-ups."
                plannedFeatures={[
                  'Direct private chat with your confirmed doctor',
                  'Share medical notes, attachments, and prescription questions',
                  'Follow-up message history and clinical recommendations',
                  'Consultation summary saved to your health history',
                ]}
                backPath="/portal/dashboard"
                backLabel="Dashboard"
                icon={MessageSquare}
                badgeVariant="patient"
              />
            }
          />
          <Route
            path="/portal/billing"
            element={
              <PlannedFeaturePage
                title="Invoices & Consultation Receipts"
                category="Patient Payments"
                description="Secure payment history, digital receipt downloads, and insurance reimbursement invoices."
                plannedFeatures={[
                  'Transparent consultation fee breakdown',
                  'Instant digital invoices with practitioner details',
                  'Saved payment methods with bank-level security',
                  'One-click dispute or cancellation refund requests',
                ]}
                backPath="/portal/dashboard"
                backLabel="Dashboard"
                icon={CreditCard}
                badgeVariant="patient"
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
