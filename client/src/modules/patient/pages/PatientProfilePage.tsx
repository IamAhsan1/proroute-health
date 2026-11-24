import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, UserProfile } from '../../../api/client';
import { AccountSecurityCard } from '../../../components/AccountSecurityCard';
import { Button, Input } from '../../../components/ui';
import {
  UserRound,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldAlert,
} from 'lucide-react';

const patientProfileSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().trim().max(30, 'Phone number is too long').optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .trim()
    .refine(
      (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Use YYYY-MM-DD format'
    )
    .optional()
    .or(z.literal('')),
  gender: z.enum(['', 'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  bloodGroup: z
    .enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'])
    .optional(),
  allergies: z.string().trim().max(500, 'Max 500 characters').optional().or(z.literal('')),
  emergencyContactName: z.string().trim().max(100, 'Max 100 characters').optional().or(z.literal('')),
  emergencyContactPhone: z.string().trim().max(30, 'Max 30 characters').optional().or(z.literal('')),
});

type PatientProfileFormData = z.infer<typeof patientProfileSchema>;

interface PatientProfilePageProps {
  currentUser: UserProfile | null;
}

export const PatientProfilePage: React.FC<PatientProfilePageProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PatientProfileFormData>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      name: currentUser?.patient?.name ?? '',
      phone: currentUser?.patient?.phone ?? '',
      dateOfBirth: currentUser?.patient?.dateOfBirth ?? '',
      gender: (currentUser?.patient?.gender as PatientProfileFormData['gender']) ?? '',
      bloodGroup: (currentUser?.patient?.bloodGroup as PatientProfileFormData['bloodGroup']) ?? '',
      allergies: currentUser?.patient?.allergies ?? '',
      emergencyContactName: currentUser?.patient?.emergencyContactName ?? '',
      emergencyContactPhone: currentUser?.patient?.emergencyContactPhone ?? '',
    },
  });

  useEffect(() => {
    if (currentUser?.patient) {
      reset({
        name: currentUser.patient.name ?? '',
        phone: currentUser.patient.phone ?? '',
        dateOfBirth: currentUser.patient.dateOfBirth ?? '',
        gender: (currentUser.patient.gender as PatientProfileFormData['gender']) ?? '',
        bloodGroup: (currentUser.patient.bloodGroup as PatientProfileFormData['bloodGroup']) ?? '',
        allergies: currentUser.patient.allergies ?? '',
        emergencyContactName: currentUser.patient.emergencyContactName ?? '',
        emergencyContactPhone: currentUser.patient.emergencyContactPhone ?? '',
      });
    }
  }, [currentUser, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: PatientProfileFormData) =>
      api.updateMe({
        name: data.name,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        allergies: data.allergies || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
      }),
    onSuccess: (res) => {
      if (res.data) {
        queryClient.setQueryData(['currentUser'], res.data);
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setFeedback({
        type: 'success',
        text: 'Your personal profile and medical intake details have been saved.',
      });
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to save your profile. Please try again.',
      });
    },
  });

  if (!currentUser) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
          <Lock className="w-8 h-8 text-outline" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Authentication Required</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          Please log into your patient account to view or edit your profile.
        </p>
      </div>
    );
  }

  if (currentUser.role !== 'PATIENT') {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-error mb-4">
          <ShieldAlert className="w-8 h-8 text-error" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Patient Portal Restricted</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          This profile page is reserved for <strong className="text-primary">PATIENT</strong> accounts.
        </p>
      </div>
    );
  }

  const onSubmit = (data: PatientProfileFormData) => {
    setFeedback(null);
    updateMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight">
          Patient Profile &amp; Intake Settings
        </h1>
        <p className="text-sm text-on-surface-variant">
          Keep your contact details, medical intake summary, and emergency contact up to date before consultations.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl bg-surface-container/85 border border-surface-container-highest/60 p-6 sm:p-8 shadow-xl flex flex-col gap-8"
        noValidate
      >
        {feedback && (
          <div
            role="alert"
            className={`rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2.5 border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-error/10 border-error/30 text-error'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Section 1: Personal & Contact */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-surface-container-highest/50 pb-3">
            <UserRound className="w-5 h-5 text-primary" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              Personal &amp; Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="patientNameInput" className="text-xs font-semibold text-on-surface">
                Full Name <span className="text-error">*</span>
              </label>
              <Input
                id="patientNameInput"
                placeholder="e.g., Ayesha Khan"
                error={!!errors.name}
                {...register('name')}
              />
              {errors.name && <p className="text-[11px] text-error">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="patientPhoneInput" className="text-xs font-semibold text-on-surface">
                Phone Number
              </label>
              <Input
                id="patientPhoneInput"
                type="tel"
                placeholder="e.g., +92 300 1234567"
                error={!!errors.phone}
                {...register('phone')}
              />
              {errors.phone && <p className="text-[11px] text-error">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="patientDobInput" className="text-xs font-semibold text-on-surface">
                Date of Birth
              </label>
              <Input
                id="patientDobInput"
                type="date"
                error={!!errors.dateOfBirth}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && (
                <p className="text-[11px] text-error">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="patientGenderSelect" className="text-xs font-semibold text-on-surface">
                Gender
              </label>
              <select
                id="patientGenderSelect"
                {...register('gender')}
                className="flex h-10 w-full rounded-xl border border-surface-container-highest bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Medical Intake Basics */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-surface-container-highest/50 pb-3">
            <HeartPulse className="w-5 h-5 text-secondary" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              Medical Intake Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="patientBloodGroupSelect" className="text-xs font-semibold text-on-surface">
                Blood Group
              </label>
              <select
                id="patientBloodGroupSelect"
                {...register('bloodGroup')}
                className="flex h-10 w-full rounded-xl border border-outline-variant/40 bg-surface-container-highest/50 px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="patientAllergiesInput" className="text-xs font-semibold text-on-surface">
                Known Allergies / Drug Sensitivities
              </label>
              <Input
                id="patientAllergiesInput"
                placeholder="e.g., Penicillin, Peanuts, or None"
                error={!!errors.allergies}
                {...register('allergies')}
              />
              {errors.allergies && (
                <p className="text-[11px] text-error">{errors.allergies.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 border-b border-surface-container-highest/50 pb-3">
            <PhoneCall className="w-5 h-5 text-amber-400" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              Emergency Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="emergencyContactNameInput" className="text-xs font-semibold text-on-surface">
                Contact Name
              </label>
              <Input
                id="emergencyContactNameInput"
                placeholder="e.g., Sara Khan (Spouse / Parent)"
                error={!!errors.emergencyContactName}
                {...register('emergencyContactName')}
              />
              {errors.emergencyContactName && (
                <p className="text-[11px] text-error">{errors.emergencyContactName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="emergencyContactPhoneInput" className="text-xs font-semibold text-on-surface">
                Contact Phone
              </label>
              <Input
                id="emergencyContactPhoneInput"
                type="tel"
                placeholder="e.g., +92 321 7654321"
                error={!!errors.emergencyContactPhone}
                {...register('emergencyContactPhone')}
              />
              {errors.emergencyContactPhone && (
                <p className="text-[11px] text-error">{errors.emergencyContactPhone.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-container-highest/50">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
          >
            {updateMutation.isPending ? 'Saving Changes...' : 'Save Profile'}
          </Button>
        </div>
      </form>

      <AccountSecurityCard currentUser={currentUser} />
    </div>
  );
};

export default PatientProfilePage;
