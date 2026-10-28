import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from './api/client';
import { AuthEnclave } from './components/AuthEnclave';
import { AuthStatus } from './components/AuthStatus';
import { RoleGuard } from './routes/RoleGuard';
import { PublicLayout } from './layouts/PublicLayout';
import { DoctorLayout } from './layouts/DoctorLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { PatientLayout } from './layouts/PatientLayout';
import { DoctorDirectoryPage } from './modules/public';
import { DoctorProfilePage } from './modules/doctor';
import { AdminVerificationsPage } from './modules/admin';
import { PatientPortalPage } from './modules/patient';

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

  const handleLogout = () => {
    queryClient.setQueryData(['currentUser'], null);
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
            Establishing Secure Clinical Enclave Session...
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
              <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between items-center py-8 px-4">
                {user ? (
                  <div className="w-full max-w-4xl flex flex-col gap-8 items-center">
                    <AuthStatus user={user} onLogout={handleLogout} />

                    {/* Role-Specific Workspaces Fast-Travel */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Doctor Directory shortcut (available to all) */}
                      <Link
                        to="/doctors"
                        className="bg-surface-container/85 border border-surface-container-highest rounded-2xl p-5 hover:border-primary/50 transition-all flex flex-col gap-2 group shadow-lg"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-[20px]">medical_services</span>
                        </div>
                        <h4 className="font-headline font-bold text-sm text-on-surface">Find Doctors</h4>
                        <p className="text-xs text-on-surface-variant">Browse verified specialists and directory</p>
                      </Link>

                      {/* Doctor Workspace shortcut */}
                      {user.role === 'DOCTOR' && (
                        <Link
                          to="/doctor/profile"
                          className="bg-surface-container/85 border border-secondary/40 rounded-2xl p-5 hover:border-secondary transition-all flex flex-col gap-2 group shadow-lg"
                        >
                          <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">badge</span>
                          </div>
                          <h4 className="font-headline font-bold text-sm text-secondary">Doctor Workspace</h4>
                          <p className="text-xs text-on-surface-variant">Credentials, availability & schedule</p>
                        </Link>
                      )}

                      {/* Patient Portal shortcut */}
                      {user.role === 'PATIENT' && (
                        <Link
                          to="/portal/dashboard"
                          className="bg-surface-container/85 border border-secondary/40 rounded-2xl p-5 hover:border-secondary transition-all flex flex-col gap-2 group shadow-lg"
                        >
                          <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">home_health</span>
                          </div>
                          <h4 className="font-headline font-bold text-sm text-secondary">Patient Portal</h4>
                          <p className="text-xs text-on-surface-variant">Telehealth appointments & records vault</p>
                        </Link>
                      )}

                      {/* Admin Control Center shortcut */}
                      {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link
                          to="/admin/verifications"
                          className="bg-surface-container/85 border border-primary/40 rounded-2xl p-5 hover:border-primary transition-all flex flex-col gap-2 group shadow-lg"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                          </div>
                          <h4 className="font-headline font-bold text-sm text-primary">Admin Control Center</h4>
                          <p className="text-xs text-on-surface-variant">Doctor verifications & platform governance</p>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <AuthEnclave onSuccess={handleAuthSuccess} />
                )}
              </div>
            }
          />
          <Route path="/doctors" element={<DoctorDirectoryPage />} />
        </Route>

        {/* 2. Doctor Clinical Workspace (Role-Protected for DOCTOR) */}
        <Route
          element={
            <RoleGuard user={user} allowedRoles={['DOCTOR']}>
              <DoctorLayout currentUser={user} onLogout={handleLogout} />
            </RoleGuard>
          }
        >
          <Route path="/doctor/profile" element={<DoctorProfilePage currentUser={user} />} />
        </Route>

        {/* 3. Administrative Operations Portal (Role-Protected for ADMIN & SUPER_ADMIN) */}
        <Route
          element={
            <RoleGuard user={user} allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminLayout currentUser={user} onLogout={handleLogout} />
            </RoleGuard>
          }
        >
          <Route path="/admin/verifications" element={<AdminVerificationsPage currentUser={user} />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
