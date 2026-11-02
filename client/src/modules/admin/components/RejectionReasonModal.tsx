import React, { useState } from 'react';
import { PendingDoctor } from '../../../services/doctor.service';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../../../components/ui';

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

  const doctorName = doctor.user?.name || (doctor as any).name || 'Doctor';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Reject Application: {doctorName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Provide a clear reason for rejecting this doctor's application (e.g. illegible credential PDF, invalid license format, medical board registration mismatch). This feedback is recorded and visible to the doctor.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rejectionReasonInput" className="text-xs font-semibold text-on-surface">
              Rejection Reason (5 to 500 characters)
            </label>
            <textarea
              id="rejectionReasonInput"
              required
              minLength={5}
              maxLength={500}
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. The uploaded license document is expired. Please submit current PMDC renewal certificate."
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-high border border-surface-container-highest focus:outline-none focus:border-destructive text-on-surface"
            />
            <span className="text-[10px] text-outline text-right">
              {rejectionReason.length}/500
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-container-highest">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isPending || rejectionReason.trim().length < 5}
              className="gap-1.5 font-semibold"
            >
              {isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
