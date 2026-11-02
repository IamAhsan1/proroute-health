import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialtyService, Specialty } from '../../../services/specialty.service';
import { doctorService, DoctorProfile } from '../../../services/doctor.service';
import { DoctorCredentialsFormData } from '../../../schemas/doctor.schema';
import { UserProfile } from '../../../api/client';
import { VerificationStatusCard } from '../components/VerificationStatusCard';
import { DoctorCredentialsForm } from '../components/DoctorCredentialsForm';
import { Lock, ShieldAlert } from 'lucide-react';

interface DoctorProfilePageProps {
  currentUser: UserProfile | null;
}

export const DoctorProfilePage: React.FC<DoctorProfilePageProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch available specialties for dropdown
  const { data: specialties = [] } = useQuery<Specialty[]>({
    queryKey: ['activeSpecialties'],
    queryFn: specialtyService.getActiveSpecialties,
  });

  // 2. Fetch current doctor profile from /api/professionals/me
  const { data: profile } = useQuery<DoctorProfile>({
    queryKey: ['myDoctorProfile'],
    queryFn: doctorService.getMyDoctorProfile,
    enabled: !!currentUser && currentUser.role === 'DOCTOR',
    retry: false,
  });

  // 3. Mutation for updating profile
  const updateMutation = useMutation({
    mutationFn: (payload: DoctorCredentialsFormData) => doctorService.updateMyDoctorProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['myDoctorProfile'], updated);
      queryClient.invalidateQueries({ queryKey: ['approvedDoctors'] });
      setFeedbackMessage({
        type: 'success',
        text: 'Your medical credentials have been updated and submitted for review.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update doctor profile';
      setFeedbackMessage({ type: 'error', text: msg });
    },
  });

  const handleSubmit = (data: DoctorCredentialsFormData) => {
    setFeedbackMessage(null);
    updateMutation.mutate(data);
  };

  if (!currentUser) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
          <Lock className="w-8 h-8 text-outline" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Authentication Required</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          Please log into your registered Doctor account to submit or manage medical board credentials.
        </p>
      </div>
    );
  }

  if (currentUser.role !== 'DOCTOR') {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-error mb-4">
          <ShieldAlert className="w-8 h-8 text-error" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Doctor Portal Restricted</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          You are currently logged in with role <strong className="text-primary">{currentUser.role}</strong>. This portal is strictly reserved for licensed healthcare professionals.
        </p>
      </div>
    );
  }

  const isEmailVerified = Boolean(currentUser.isEmailVerified);

  return (
    <div className="w-full min-h-screen bg-background text-on-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <VerificationStatusCard
          profile={profile}
          isEmailVerified={isEmailVerified}
          userEmail={currentUser.email}
        />

        <DoctorCredentialsForm
          initialData={profile}
          onSubmit={handleSubmit}
          specialties={specialties}
          isPending={updateMutation.isPending}
          feedbackMessage={feedbackMessage}
        />
      </div>
    </div>
  );
};

export default DoctorProfilePage;
