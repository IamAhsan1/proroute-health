import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X, Loader2, Info } from 'lucide-react';
import { appointmentService, AppointmentDto } from '../../../services/appointment.service';
import { extractApiError, ApiErrorPayload } from '../../../lib/apiError';
import { SupportReferenceCode } from '../../../components/ui/SupportReferenceCode';
import { Dialog, DialogContent } from '../../../components/ui';
import { getUserTimezone, formatZonedDate, formatZonedRange } from '../../../lib/timezone';

export interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentDto | null;
  actorRole?: 'PATIENT' | 'DOCTOR';
  onSuccess?: () => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  actorRole = 'PATIENT',
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [errorDetails, setErrorDetails] = useState<ApiErrorPayload | null>(null);

  const isDoctor = actorRole === 'DOCTOR';
  const patientTz = getUserTimezone();

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) throw new Error('No appointment selected');
      return appointmentService.cancelAppointment(
        appointment.id,
        reason.trim() || undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      setErrorDetails(extractApiError(err));
    },
  });

  if (!isOpen || !appointment) return null;

  const isConfirmed = appointment.status === 'CONFIRMED';
  const hoursUntilStart =
    (new Date(appointment.startTimeUtc).getTime() - Date.now()) / (1000 * 60 * 60);
  const isWithin2Hours = isConfirmed && hoursUntilStart < 2;

  const isSubmitDisabled =
    cancelMutation.isPending ||
    (isDoctor && reason.trim().length < 3) ||
    (!isDoctor && isWithin2Hours);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton className="p-0 overflow-hidden max-w-md border border-surface-container-highest shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-highest/60 bg-surface-container-lowest/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center text-error">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="cancel-modal-title" className="text-base font-bold text-on-surface">
              Cancel Appointment
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorDetails && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs space-y-1"
            >
              <p className="font-semibold">{errorDetails.message}</p>
              {errorDetails.requestId && (
                <div className="pt-1">
                  <SupportReferenceCode requestId={errorDetails.requestId} />
                </div>
              )}
            </div>
          )}

          {/* Appointment Preview */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-highest/60 text-xs space-y-1">
            <p className="font-semibold text-on-surface">
              {appointment.professional?.name
                ? `Dr. ${appointment.professional.name}`
                : appointment.patient?.name
                ? `Patient: ${appointment.patient.name}`
                : 'Consultation'}
            </p>
            <p className="text-on-surface-variant">
              {formatZonedDate(appointment.startTimeUtc, patientTz)} •{' '}
              {formatZonedRange(appointment.startTimeUtc, appointment.endTimeUtc, patientTz)}
            </p>
          </div>

          {/* Policy Warning */}
          {isWithin2Hours && !isDoctor ? (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Cancellation Window Closed:</strong> Confirmed appointments cannot be cancelled within 2 hours of the scheduled start time. Please contact the clinic directly for assistance.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-highest/60 text-on-surface-variant text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                {isConfirmed
                  ? 'Confirmed appointments require at least 2 hours advance notice before start time.'
                  : 'Pending reservation hold can be released immediately.'}
              </span>
            </div>
          )}

          {/* Cancellation Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="text-xs font-semibold text-on-surface flex items-center justify-between">
              <span>
                Reason for Cancellation {isDoctor ? <span className="text-error">*</span> : '(Optional)'}
              </span>
              <span className="text-[10px] text-outline">{reason.length}/500</span>
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isDoctor
                  ? 'Please state the medical or operational reason for cancelling this appointment (required)...'
                  : 'Let the clinic know why you need to cancel (optional)...'
              }
              className="w-full text-xs p-3 rounded-xl bg-surface-container-low border border-surface-container-highest/80 focus:border-error focus:outline-none focus:ring-1 focus:ring-error text-on-surface placeholder:text-outline transition-all"
            />
            {isDoctor && reason.trim().length < 3 && (
              <p className="text-[11px] text-error font-medium">
                A reason of at least 3 characters is required for doctors.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-container-highest/60 bg-surface-container-lowest/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={() => cancelMutation.mutate()}
            className="py-2 px-4 bg-error text-on-error rounded-xl font-semibold text-xs hover:bg-error/90 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Confirm Cancellation</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
