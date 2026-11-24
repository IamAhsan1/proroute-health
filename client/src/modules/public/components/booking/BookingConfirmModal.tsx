import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  FileText,
  Loader2,
  Info,
  Timer,
} from 'lucide-react';
import {
  appointmentService,
  AppointmentDto,
} from '../../../../services/appointment.service';
import { extractApiError, ApiErrorPayload } from '../../../../lib/apiError';
import { SupportReferenceCode } from '../../../../components/ui/SupportReferenceCode';
import { Dialog, DialogContent } from '../../../../components/ui';
import {
  getUserTimezone,
  formatZonedDate,
  formatZonedRange,
} from '../../../../lib/timezone';
import { useCurrency } from '../../../../context/CurrencyContext';

export interface BookingDoctorSummary {
  id: string;
  name?: string | null;
  specialty?: {
    name: string;
  } | null;
  timezone?: string;
  consultationFee?: number | null;
}

export interface BookingSlotSummary {
  startUtc: string;
  endUtc: string;
  localStartTime?: string;
  localEndTime?: string;
}

export interface BookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: BookingDoctorSummary;
  slot: BookingSlotSummary | null;
  isAuthenticated?: boolean;
}

export const BookingConfirmModal: React.FC<BookingConfirmModalProps> = ({
  isOpen,
  onClose,
  doctor,
  slot,
  isAuthenticated = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { formatFee } = useCurrency();

  const [notes, setNotes] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState<AppointmentDto | null>(null);
  const [errorDetails, setErrorDetails] = useState<ApiErrorPayload | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15 * 60);

  const patientTz = getUserTimezone();
  const clinicTz = doctor.timezone || 'Asia/Karachi';

  // Reset local state when opened with a new slot
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setCreatedAppointment(null);
      setErrorDetails(null);
      setRemainingSeconds(15 * 60);
    }
  }, [isOpen, slot?.startUtc]);

  // 15-minute hold live countdown timer
  useEffect(() => {
    if (!createdAppointment || createdAppointment.status !== 'PENDING') return;

    // Calculate initial remaining seconds based on expiresAt if available
    if (createdAppointment.expiresAt) {
      const msLeft = new Date(createdAppointment.expiresAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.floor(msLeft / 1000)));
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAppointment]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Booking reservation mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!slot) throw new Error('No time slot selected');
      return appointmentService.reserveSlot({
        professionalId: doctor.id,
        startTimeUtc: slot.startUtc,
        endTimeUtc: slot.endUtc,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (data) => {
      setCreatedAppointment(data);
      setErrorDetails(null);
      // Invalidate slots cache so the taken slot reflects immediately across views
      queryClient.invalidateQueries({ queryKey: ['doctor-slots', doctor.id] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (err) => {
      const parsed = extractApiError(err);
      setErrorDetails(parsed);
      // If slot conflict (409), refresh doctor's slots so UI shows updated availability
      if (parsed.statusCode === 409) {
        queryClient.invalidateQueries({ queryKey: ['doctor-slots', doctor.id] });
      }
    },
  });

  // Pre-Phase 5 confirmation bridge mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!createdAppointment) return;
      return appointmentService.confirmPendingAppointment(createdAppointment.id);
    },
    onSuccess: (updated) => {
      if (updated) {
        setCreatedAppointment(updated);
        queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      }
    },
    onError: (err) => {
      setErrorDetails(extractApiError(err));
    },
  });

  if (!isOpen || !slot) return null;

  const isConfirmed = createdAppointment?.status === 'CONFIRMED';
  const isPending = createdAppointment?.status === 'PENDING';
  const isConflict = errorDetails?.statusCode === 409;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton className="p-0 overflow-hidden max-h-[90vh] flex flex-col sm:max-w-lg border border-surface-container-highest shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-highest/60 bg-surface-container-lowest/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 id="booking-modal-title" className="text-base font-bold text-on-surface">
                {isConfirmed
                  ? 'Consultation Confirmed'
                  : isPending
                  ? 'Reservation Hold Placed'
                  : 'Confirm Appointment'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Dr. {doctor.name || 'Specialist'} • {doctor.specialty?.name || 'Healthcare Practitioner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* SUCCESS STATE: Confirmed */}
          {isConfirmed && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold">Appointment Confirmed!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Your appointment has been successfully scheduled. A confirmation email has been dispatched.
                  </p>
                </div>
              </div>

              {/* Slot Summary */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-highest/60 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="text-on-surface-variant font-medium">Date</span>
                  <span className="font-semibold">{formatZonedDate(slot.startUtc, patientTz)}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="text-on-surface-variant font-medium">Your Time ({patientTz})</span>
                  <span className="font-semibold">{formatZonedRange(slot.startUtc, slot.endUtc, patientTz)}</span>
                </div>
                {patientTz !== clinicTz && (
                  <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-1 border-t border-surface-container-highest/40">
                    <span>Doctor Time ({clinicTz})</span>
                    <span>{formatZonedRange(slot.startUtc, slot.endUtc, clinicTz)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest/60 font-medium">
                  <span className="text-on-surface-variant">Consultation Fee</span>
                  <span className="text-primary font-bold">
                    {doctor.consultationFee
                      ? formatFee(doctor.consultationFee, { showSecondary: true })
                      : 'Free Consultation'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/portal/appointments');
                  }}
                  className="w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>View in My Appointments</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS STATE: Pending Hold (with 15-min countdown) */}
          {isPending && !isConfirmed && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3">
                <Timer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-900">Slot Held for 15 Minutes</h4>
                    <span className="font-mono font-extrabold text-sm text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded-md">
                      {formatCountdown(remainingSeconds)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    This slot is reserved for you. Please confirm your booking before the timer expires, or the slot will automatically release.
                  </p>
                </div>
              </div>

              {/* Slot Summary */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-highest/60 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="text-on-surface-variant font-medium">Date</span>
                  <span className="font-semibold">{formatZonedDate(slot.startUtc, patientTz)}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="text-on-surface-variant font-medium">Your Time ({patientTz})</span>
                  <span className="font-semibold">{formatZonedRange(slot.startUtc, slot.endUtc, patientTz)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest/60 font-medium">
                  <span className="text-on-surface-variant">Consultation Fee</span>
                  <span className="text-primary font-bold">
                    {doctor.consultationFee
                      ? formatFee(doctor.consultationFee, { showSecondary: true })
                      : 'Free Consultation'}
                  </span>
                </div>
              </div>

              {/* Pre-Phase 5 Confirmation Action */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={confirmMutation.isPending || remainingSeconds === 0}
                  onClick={() => confirmMutation.mutate()}
                  className="w-full py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Consultation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Appointment</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/portal/appointments');
                  }}
                  className="w-full py-2 px-4 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors text-center"
                >
                  Manage in My Appointments
                </button>
              </div>
            </div>
          )}

          {/* INITIAL BOOKING FORM */}
          {!createdAppointment && (
            <div className="space-y-4">
              {/* Conflict / Error Banner */}
              {errorDetails && (
                <div
                  role="alert"
                  className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                    isConflict
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                      : 'bg-error/10 border-error/20 text-error'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">
                      {isConflict
                        ? 'Time Slot Already Reserved'
                        : 'Unable to Complete Reservation'}
                    </p>
                    <p>
                      {isConflict
                        ? 'This time slot was just reserved by another patient. Please select another open time slot on the schedule.'
                        : errorDetails.message}
                    </p>
                    {errorDetails.requestId && (
                      <div className="pt-1">
                        <SupportReferenceCode requestId={errorDetails.requestId} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Slot Details Card */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-highest/60 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-on-surface font-semibold text-sm pb-2 border-b border-surface-container-highest/60">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Scheduled Appointment Time</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-on-surface">
                  <div>
                    <span className="text-on-surface-variant block text-[11px]">Date</span>
                    <span className="font-medium text-xs">
                      {formatZonedDate(slot.startUtc, patientTz)}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[11px]">
                      Your Local Time ({patientTz})
                    </span>
                    <span className="font-medium text-xs">
                      {formatZonedRange(slot.startUtc, slot.endUtc, patientTz)}
                    </span>
                  </div>
                </div>

                {patientTz !== clinicTz && (
                  <div className="text-[11px] text-on-surface-variant bg-surface-container/60 p-2 rounded-lg flex items-center justify-between">
                    <span>Doctor Clinic Time ({clinicTz})</span>
                    <span className="font-medium">
                      {formatZonedRange(slot.startUtc, slot.endUtc, clinicTz)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest/60">
                  <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    <span>Consultation Fee</span>
                  </span>
                  <span className="text-primary font-bold text-sm">
                    {doctor.consultationFee
                      ? formatFee(doctor.consultationFee, { showSecondary: true })
                      : 'Free Consultation'}
                  </span>
                </div>
              </div>

              {/* Visit Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="visit-notes"
                  className="text-xs font-semibold text-on-surface flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-outline" />
                    <span>Reason for Visit / Symptoms (Optional)</span>
                  </span>
                  <span className="text-[10px] text-outline">{notes.length}/1000</span>
                </label>
                <textarea
                  id="visit-notes"
                  rows={3}
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Briefly describe your symptoms, health concerns, or any questions for the doctor..."
                  className="w-full text-xs p-3 rounded-xl bg-surface-container-low border border-surface-container-highest/80 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-outline transition-all"
                />
              </div>

              {/* Policy Notice */}
              <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-highest/60 flex items-start gap-2 text-[11px] text-on-surface-variant">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Cancellation Policy:</strong> Confirmed appointments can be cancelled up to 2 hours prior to scheduled consultation start time.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors text-center"
                >
                  Cancel
                </button>

                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      const returnUrl = encodeURIComponent(location.pathname + location.search);
                      navigate(`/login?redirect=${returnUrl}`);
                    }}
                    className="flex-1 py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-xs hover:bg-primary/90 flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Sign In to Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={bookMutation.isPending}
                    onClick={() => bookMutation.mutate()}
                    className="flex-1 py-2.5 px-4 bg-primary text-on-primary rounded-xl font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {bookMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Reserving Slot...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Confirm & Reserve Slot</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
