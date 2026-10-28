import React from 'react';
import { Specialty } from '../../../services/specialty.service';
import { UpdateDoctorProfilePayload } from '../../../services/doctor.service';

interface DoctorCredentialsFormProps {
  formData: UpdateDoctorProfilePayload;
  onChange: (field: keyof UpdateDoctorProfilePayload, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  specialties: Specialty[];
  isPending: boolean;
  feedbackMessage: { type: 'success' | 'error'; text: string } | null;
}

export const DoctorCredentialsForm: React.FC<DoctorCredentialsFormProps> = ({
  formData,
  onChange,
  onSubmit,
  specialties,
  isPending,
  feedbackMessage,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-error/10 border-error/40 text-error'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedbackMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {feedbackMessage.text}
        </div>
      )}

      {/* Form Bento Container */}
      <form
        onSubmit={onSubmit}
        className="bg-surface-container/85 backdrop-blur-xl border border-surface-container-highest/70 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* License Number */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Medical License # <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.licenseNumber}
              onChange={(e) => onChange('licenseNumber', e.target.value)}
              placeholder="e.g. MD-123456 or PMDC-8921"
              className="w-full bg-surface-container-lowest text-on-surface font-mono text-sm rounded-xl px-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
            />
            <span className="text-[11px] text-outline">
              Must uniquely match your official state or council registration.
            </span>
          </div>

          {/* Medical Board */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Licensing Authority / Board <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.medicalBoard}
              onChange={(e) => onChange('medicalBoard', e.target.value)}
              placeholder="e.g. State Medical Board / PMDC"
              className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl px-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Primary Specialty */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Primary Specialty <span className="text-primary">*</span>
            </label>
            <select
              value={formData.specialtyId || ''}
              onChange={(e) => onChange('specialtyId', e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl px-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Select Medical Specialty</option>
              {specialties.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Years of Experience */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="70"
              value={formData.yearsOfExperience}
              onChange={(e) => onChange('yearsOfExperience', Number(e.target.value))}
              className="w-full bg-surface-container-lowest text-on-surface font-mono text-sm rounded-xl px-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Consultation Fee */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Consultation Fee (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline font-mono text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.consultationFee}
                onChange={(e) => onChange('consultationFee', Number(e.target.value))}
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-sm rounded-xl pl-8 pr-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Professional Bio */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
            Practitioner Biography & Clinical Focus
          </label>
          <textarea
            rows={4}
            value={formData.bio || ''}
            onChange={(e) => onChange('bio', e.target.value)}
            placeholder="Summarize your clinical background, fellowships, sub-specialty interests, and telehealth care philosophy..."
            className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl p-4 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Verification Document URL */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
            Official Licensure Document Link (PDF / Scan)
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              link
            </span>
            <input
              type="url"
              value={formData.credentialDocumentUrl || ''}
              onChange={(e) => onChange('credentialDocumentUrl', e.target.value)}
              placeholder="https://cloud-storage.proroute.health/certificates/license.pdf"
              className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl pl-10 pr-4 py-3 border border-surface-container-highest focus:outline-none focus:border-primary transition-colors font-mono"
            />
          </div>
          <span className="text-[11px] text-outline">
            In production, medical certificates are uploaded directly to private S3 enclaves.
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-4 border-t border-surface-container-highest/60">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-fixed disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {isPending ? 'Submitting Credentials...' : 'Save & Submit For Verification'}
          </button>
        </div>
      </form>
    </div>
  );
};
