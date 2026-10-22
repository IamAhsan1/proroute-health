import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from './api/client';
import { AuthEnclave } from './components/AuthEnclave';
import { AuthStatus } from './components/AuthStatus';

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

  return (
    <main className="w-full min-h-screen bg-background text-on-surface relative flex flex-col justify-between items-center selection:bg-primary-container selection:text-on-primary-container">
      {currentUser ? (
        <AuthStatus user={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthEnclave onSuccess={handleAuthSuccess} />
      )}
    </main>
  );
};

export default App;
