import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialtyService, Specialty } from '../../../services/specialty.service';
import { doctorService, DoctorProfile, UpdateDoctorProfilePayload } from '../../../services/doctor.service';
import { UserProfile } from '../../../api/client';
import { VerificationStatusCard } from '../components/VerificationStatusCard';
import { DoctorCredentialsForm } from '../components/DoctorCredentialsForm';

interface DoctorProfilePageProps {
  currentUser: UserProfile | null;
}

export const DoctorProfilePage: React.FC<DoctorProfilePageProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UpdateDoctorProfilePayload>({
    licenseNumber: '',
    medicalBoard: '',
    specialtyId: '',
    yearsOfExperience: 5,
    consultationFee: 45,
    bio: '',
    credentialDocumentUrl: '',
  });

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

  // Populate form with existing data once loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        licenseNumber: profile.licenseNumber || '',
        medicalBoard: profile.medicalBoard || '',
        specialtyId: profile.specialtyId || '',
        yearsOfExperience: profile.yearsOfExperience ?? 5,
        consultationFee: profile.consultationFee ? Number(profile.consultationFee) : 45,
        bio: profile.bio || '',
        credentialDocumentUrl: profile.credentialDocumentUrl || '',
      });
    }
  }, [profile]);

  // 3. Mutation for updating profile
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateDoctorProfilePayload) => doctorService.updateMyDoctorProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['myDoctorProfile'], updated);
      queryClient.invalidateQueries({ queryKey: ['approvedDoctors'] });
      setFeedbackMessage({
        type: 'success',
        text: 'Credentials updated. Status reset to PENDING for administrative audit.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update doctor profile';
      setFeedbackMessage({ type: 'error', text: msg });
    },
  });

  const handleFieldChange = (field: keyof UpdateDoctorProfilePayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    updateMutation.mutate({
      ...formData,
      consultationFee: Number(formData.consultationFee),
      yearsOfExperience: Number(formData.yearsOfExperience),
    });
  };

  if (!currentUser) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
          <span className="material-symbols-outlined text-[32px]">lock</span>
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
          <span className="material-symbols-outlined text-[32px]">shield</span>
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Doctor Portal Restricted</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          You are currently logged in with role <strong className="text-primary">{currentUser.role}</strong>. This portal is strictly reserved for licensed healthcare professionals.
        </p>
      </div>
    );
  }

  const isEmailVerified = currentUser.isEmailVerified !== false;

  return (
    <div className="w-full min-h-screen bg-background text-on-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <VerificationStatusCard
          profile={profile}
          isEmailVerified={isEmailVerified}
        />

        <DoctorCredentialsForm
          formData={formData}
          onChange={handleFieldChange}
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
