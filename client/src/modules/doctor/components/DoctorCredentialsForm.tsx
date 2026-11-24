import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  doctorCredentialsSchema,
  DoctorCredentialsFormData,
} from '../../../schemas/doctor.schema';
import { Specialty } from '../../../services/specialty.service';
import { DoctorProfile } from '../../../services/doctor.service';
import {
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  Save,
  DollarSign,
  Briefcase,
  FileBadge,
} from 'lucide-react';
import { Button, Input } from '../../../components/ui';

interface DoctorCredentialsFormProps {
  initialData?: DoctorProfile | null;
  onSubmit: (data: DoctorCredentialsFormData) => void;
  specialties: Specialty[];
  isPending: boolean;
  feedbackMessage: { type: 'success' | 'error'; text: string } | null;
}

export const DoctorCredentialsForm: React.FC<DoctorCredentialsFormProps> = ({
  initialData,
  onSubmit,
  specialties,
  isPending,
  feedbackMessage,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoctorCredentialsFormData>({
    resolver: zodResolver(doctorCredentialsSchema),
    defaultValues: {
      name: '',
      licenseNumber: '',
      medicalBoard: '',
      specialtyId: '',
      yearsOfExperience: 5,
      consultationFee: 45,
      bio: '',
      credentialDocumentUrl: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        licenseNumber: initialData.licenseNumber || '',
        medicalBoard: initialData.medicalBoard || '',
        specialtyId: initialData.specialtyId || '',
        yearsOfExperience: initialData.yearsOfExperience ?? 5,
        consultationFee: initialData.consultationFee ? Number(initialData.consultationFee) : 45,
        bio: initialData.bio || '',
        credentialDocumentUrl: initialData.credentialDocumentUrl || '',
      });
    }
  }, [initialData, reset]);

  return (
    <div className="flex flex-col gap-4">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-2 animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-error/10 border-error/40 text-error'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-primary" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-error" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Form Bento Container */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* Step 1: Clinical Profile & Specialty */}
        <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container-highest/60">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">1. Clinical Identity & Specialty</h3>
              <p className="text-xs text-on-surface-variant">Your public practitioner name and medical specialty</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Doctor Full Name */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="doctorNameInput" className="text-xs font-semibold text-on-surface">
                Full Name (Displayed to Patients) <span className="text-primary">*</span>
              </label>
              <Input
                id="doctorNameInput"
                type="text"
                placeholder="e.g. Dr. Ayesha Khan"
                error={!!errors.name}
                {...register('name')}
              />
              {errors.name ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.name.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  Your professional display name shown in the public doctor directory.
                </span>
              )}
            </div>

            {/* Clinical Specialty Dropdown */}
            <div className="flex flex-col gap-2">
              <label htmlFor="specialtySelect" className="text-xs font-semibold text-on-surface">
                Primary Medical Specialty <span className="text-primary">*</span>
              </label>
              <select
                id="specialtySelect"
                {...register('specialtyId')}
                className={`w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl px-4 py-2.5 border transition-colors focus:outline-none ${
                  errors.specialtyId
                    ? 'border-error focus:border-error'
                    : 'border-surface-container-highest focus:border-primary'
                }`}
              >
                <option value="" disabled>
                  Select your registered specialty
                </option>
                {specialties.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
              {errors.specialtyId ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.specialtyId.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  Patients search for doctors through these curated specialties.
                </span>
              )}
            </div>

            {/* Experience Years */}
            <div className="flex flex-col gap-2">
              <label htmlFor="experienceInput" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-secondary" />
                Years of Clinical Experience
              </label>
              <Input
                id="experienceInput"
                type="number"
                min="0"
                max="70"
                error={!!errors.yearsOfExperience}
                className="font-mono"
                {...register('yearsOfExperience')}
              />
              {errors.yearsOfExperience ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.yearsOfExperience.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  Post-internship / post-residency active clinical years.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Licensure & Verification */}
        <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container-highest/60">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <FileBadge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">2. Medical Licensure & Verification</h3>
              <p className="text-xs text-on-surface-variant">Council accreditation for administrative approval</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* License Number */}
            <div className="flex flex-col gap-2">
              <label htmlFor="licenseNumberInput" className="text-xs font-semibold text-on-surface">
                Medical License # <span className="text-primary">*</span>
              </label>
              <Input
                id="licenseNumberInput"
                type="text"
                placeholder="e.g. MD-123456 or PMDC-8921"
                error={!!errors.licenseNumber}
                className="font-mono"
                {...register('licenseNumber')}
              />
              {errors.licenseNumber ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.licenseNumber.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  Must uniquely match your official medical license.
                </span>
              )}
            </div>

            {/* Medical Board */}
            <div className="flex flex-col gap-2">
              <label htmlFor="medicalBoardInput" className="text-xs font-semibold text-on-surface">
                Licensing Medical Board / Council <span className="text-primary">*</span>
              </label>
              <Input
                id="medicalBoardInput"
                type="text"
                placeholder="e.g. Pakistan Medical & Dental Council (PMDC)"
                error={!!errors.medicalBoard}
                {...register('medicalBoard')}
              />
              {errors.medicalBoard ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.medicalBoard.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  The regulatory authority that issued your practice license.
                </span>
              )}
            </div>

            {/* Verification Document URL */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="credentialUrlInput" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-secondary" />
                Official Licensure Document Link (PDF / Scan)
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                <Input
                  id="credentialUrlInput"
                  type="url"
                  placeholder="https://cloud-storage.proroute.health/certificates/license.pdf"
                  error={!!errors.credentialDocumentUrl}
                  className="pl-10 font-mono"
                  {...register('credentialDocumentUrl')}
                />
              </div>
              {errors.credentialDocumentUrl ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.credentialDocumentUrl.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  Provide a secure link to your PMDC certificate or official registration scan.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Rates & Public Bio */}
        <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container-highest/60">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">3. Consultation Rates & Philosophy</h3>
              <p className="text-xs text-on-surface-variant">Fee structure and background information for patients</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Consultation Fee */}
            <div className="flex flex-col gap-2">
              <label htmlFor="feeInput" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Telehealth Consultation Fee ($ USD) <span className="text-primary">*</span>
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-primary font-bold text-sm pointer-events-none">
                  $
                </span>
                <Input
                  id="feeInput"
                  type="number"
                  min="0"
                  step="1"
                  error={!!errors.consultationFee}
                  className="pl-8 font-mono"
                  {...register('consultationFee')}
                />
              </div>
              {errors.consultationFee ? (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.consultationFee.message}
                </span>
              ) : (
                <span className="text-[11px] text-outline">
                  Standard 30-minute telehealth consultation rate charged to patients.
                </span>
              )}
            </div>

            {/* Bio / Practice Philosophy */}
            <div className="flex flex-col gap-2">
              <label htmlFor="bioInput" className="text-xs font-semibold text-on-surface">
                Professional Summary & Practice Philosophy
              </label>
              <textarea
                id="bioInput"
                rows={4}
                {...register('bio')}
                placeholder="Summarize your clinical background, fellowships, sub-specialty interests, and telehealth care philosophy..."
                className={`w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl p-4 border transition-colors focus:outline-none ${
                  errors.bio
                    ? 'border-error focus:border-error'
                    : 'border-surface-container-highest focus:border-primary'
                }`}
              />
              {errors.bio && (
                <span className="text-[11px] text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                  {errors.bio.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 px-7 py-3 font-semibold text-xs shadow-md shadow-primary/20 rounded-xl"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Submitting Credentials...' : 'Save & Submit For Verification'}
          </Button>
        </div>
      </form>
    </div>
  );
};
