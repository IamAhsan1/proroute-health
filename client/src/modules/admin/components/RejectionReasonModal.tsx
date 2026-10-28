import React, { useState } from 'react';
import { PendingDoctor } from '../../../services/doctor.service';

interface RejectionReasonModalProps {
  doctor: PendingDoctor;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  doctor,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionReason.trim().length >= 5) {
      onConfirm(rejectionReason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">gpp_bad</span>
            Reject Application: {doctor.user.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Provide a clear reason for rejecting this doctor's application (e.g. illegible credential PDF, invalid license format, medical board registration mismatch). This feedback is recorded and visible to the doctor.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-outline">
              Rejection Reason (5 to 500 characters)
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. The submitted PMDC license number could not be verified on the official registry portal. Please upload a clear copy of your valid registration card."
              className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl p-3 border border-surface-container-highest focus:outline-none focus:border-error transition-colors"
            />
            <div className="flex justify-between text-[11px] text-outline font-mono">
              <span>Minimum 5 characters required</span>
              <span>{rejectionReason.length} / 500</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-highest">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectionReason.trim().length < 5 || isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-error text-on-error hover:bg-red-500 disabled:opacity-40 transition-colors shadow-md flex items-center gap-1.5"
            >
              {isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
