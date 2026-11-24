import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  UserX,
  Timer,
  FileText,
  ShieldCheck,
  Building2,
  MoreVertical,
  Info,
} from 'lucide-react';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../components/ui';
import {
  AppointmentDto,
  AppointmentStatus,
} from '../../../services/appointment.service';
import {
  getUserTimezone,
  formatZonedDate,
  formatZonedRange,
} from '../../../lib/timezone';
import { useCurrency } from '../../../context/CurrencyContext';

export interface AppointmentCardProps {
  appointment: AppointmentDto;
  viewerRole?: 'PATIENT' | 'DOCTOR';
  onCancelClick?: (appointment: AppointmentDto) => void;
  onConfirmHoldClick?: (appointment: AppointmentDto) => void;
  onStatusTransition?: (
    appointment: AppointmentDto,
    targetStatus: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW'
  ) => void;
  isActionLoading?: boolean;
}

export const getStatusBadgeConfig = (status: AppointmentStatus) => {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending Hold',
        className: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
        icon: Timer,
      };
    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        className: 'bg-primary/15 text-primary border-primary/30',
        icon: CheckCircle2,
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Consultation',
        className: 'bg-secondary/15 text-secondary border-secondary/30',
        icon: Play,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
        icon: Check,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        className: 'bg-error/15 text-error border-error/30',
        icon: XCircle,
      };
    case 'EXPIRED':
      return {
        label: 'Hold Expired',
        className: 'bg-surface-container-high text-on-surface-variant border-surface-container-highest',
        icon: Clock,
      };
    case 'NO_SHOW':
      return {
        label: 'No-Show',
        className: 'bg-error/15 text-error border-error/30',
        icon: UserX,
      };
    default:
      return {
        label: status,
        className: 'bg-surface-container text-on-surface border-surface-container-highest',
        icon: AlertCircle,
      };
  }
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  viewerRole = 'PATIENT',
  onCancelClick,
  onConfirmHoldClick,
  onStatusTransition,
  isActionLoading = false,
}) => {
  const { formatFee } = useCurrency();
  const patientTz = getUserTimezone();
  const clinicTz = appointment.professional?.timezone || 'Asia/Karachi';

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (appointment.status !== 'PENDING' || !appointment.expiresAt) return 0;
    const diff = Math.floor(
      (new Date(appointment.expiresAt).getTime() - Date.now()) / 1000
    );
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (appointment.status !== 'PENDING' || !appointment.expiresAt) return;

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
  }, [appointment.status, appointment.expiresAt]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const statusConfig = getStatusBadgeConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  const isConfirmed = appointment.status === 'CONFIRMED';
  const isPending = appointment.status === 'PENDING';
  const isInProgress = appointment.status === 'IN_PROGRESS';

  const hoursUntilStart =
    (new Date(appointment.startTimeUtc).getTime() - Date.now()) / (1000 * 60 * 60);
  const isWithin2Hours = isConfirmed && hoursUntilStart < 2;

  const otherPartyName =
    viewerRole === 'PATIENT'
      ? appointment.professional?.name
        ? `Dr. ${appointment.professional.name}`
        : 'Specialist'
      : appointment.patient?.name || 'Patient';

  const specialtyName = appointment.professional?.specialty?.name;

  return (
    <div className="bg-surface border border-surface-container-highest/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      {/* Top Row: Doctor/Patient Info & Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            {viewerRole === 'PATIENT' ? (
              <Building2 className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span>{otherPartyName}</span>
              {viewerRole === 'PATIENT' && (
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              )}
            </h3>
            {viewerRole === 'PATIENT' && specialtyName && (
              <p className="text-xs text-on-surface-variant font-medium">
                {specialtyName}
              </p>
            )}
            {viewerRole === 'DOCTOR' && appointment.patient?.phone && (
              <p className="text-xs text-on-surface-variant font-mono">
                {appointment.patient.phone}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.className}`}
          >
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isPending && remainingSeconds > 0
                ? `Hold: ${formatCountdown(remainingSeconds)}`
                : statusConfig.label}
            </span>
          </span>
        </div>
      </div>

      {/* Middle Row: Date, Time & Fee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-surface-container-low p-3.5 rounded-xl border border-surface-container-highest/60 text-xs">
        <div className="flex items-center gap-2 text-on-surface">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold">
            {formatZonedDate(appointment.startTimeUtc, patientTz)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-on-surface">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold">
            {formatZonedRange(
              appointment.startTimeUtc,
              appointment.endTimeUtc,
              patientTz
            )}
          </span>
        </div>

        {patientTz !== clinicTz && (
          <div className="col-span-1 sm:col-span-2 text-[11px] text-on-surface-variant flex items-center justify-between border-t border-surface-container-highest/40 pt-1.5">
            <span>Clinic Time ({clinicTz})</span>
            <span>
              {formatZonedRange(
                appointment.startTimeUtc,
                appointment.endTimeUtc,
                clinicTz
              )}
            </span>
          </div>
        )}

        <div className="col-span-1 sm:col-span-2 flex items-center justify-between border-t border-surface-container-highest/40 pt-1.5">
          <span className="text-on-surface-variant flex items-center gap-1 font-medium">
            <DollarSign className="w-3.5 h-3.5 text-primary" />
            <span>Consultation Fee</span>
          </span>
          <span className="font-bold text-primary">
            {appointment.consultationFee
              ? formatFee(appointment.consultationFee, { showSecondary: true })
              : 'Free Consultation'}
          </span>
        </div>
      </div>

      {/* Notes / Reason for Visit */}
      {appointment.notes && (
        <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-container-highest/60 text-xs space-y-1">
          <span className="text-[11px] font-semibold text-on-surface flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-outline" />
            <span>Patient Notes:</span>
          </span>
          <p className="text-on-surface-variant italic text-[11px]">
            "{appointment.notes}"
          </p>
        </div>
      )}

      {/* Cancellation Reason if Cancelled */}
      {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
        <div className="p-2.5 rounded-lg bg-error/10 border border-error/20 text-xs space-y-1 text-error">
          <span className="font-semibold block">
            Cancellation Reason ({appointment.cancelledByRole || 'User'}):
          </span>
          <p className="italic text-[11px] text-error/90">
            "{appointment.cancellationReason}"
          </p>
        </div>
      )}

      {/* Policy Warning when Confirmed & Within 2h */}
      {isWithin2Hours && viewerRole === 'PATIENT' && (
        <p className="text-[11px] text-outline italic">
          * Cancellations are closed within 2 hours of scheduled consultation.
        </p>
      )}

      {/* Bottom Actions Row */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-surface-container-highest/60">
        {/* Details & Audit Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsDetailOpen(true)}
          className="py-1.5 px-3 rounded-xl border border-surface-container-highest hover:bg-surface-container-highest/60 text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5 text-outline" />
          <span>Details</span>
        </button>

        {/* PATIENT ACTIONS */}
        {viewerRole === 'PATIENT' && (
          <>
            {/* Pre-Phase 5 Confirmation Bridge */}
            {isPending && onConfirmHoldClick && (
              <button
                type="button"
                disabled={isActionLoading || remainingSeconds === 0}
                onClick={() => onConfirmHoldClick(appointment)}
                className="py-1.5 px-3 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Confirm Booking</span>
              </button>
            )}

            {/* Cancel Button */}
            {(isPending || isConfirmed) && onCancelClick && (
              <button
                type="button"
                disabled={isActionLoading || isWithin2Hours}
                onClick={() => onCancelClick(appointment)}
                title={
                  isWithin2Hours
                    ? 'Cannot cancel within 2 hours of consultation start'
                    : 'Cancel appointment'
                }
                className="py-1.5 px-3 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-colors"
              >
                Cancel Consultation
              </button>
            )}

            {/* Expired Slot: Book Again Link */}
            {appointment.status === 'EXPIRED' && appointment.professionalId && (
              <Link
                to={`/doctors/${appointment.professionalId}`}
                className="py-1.5 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-semibold transition-colors"
              >
                Book New Slot
              </Link>
            )}
          </>
        )}

        {/* DOCTOR ACTIONS */}
        {viewerRole === 'DOCTOR' && onStatusTransition && (
          <>
            {isPending && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onStatusTransition(appointment, 'CONFIRMED')}
                className="py-1.5 px-3 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            )}

            {isConfirmed && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => onStatusTransition(appointment, 'IN_PROGRESS')}
                  className="py-1.5 px-3 bg-secondary text-on-secondary rounded-xl text-xs font-semibold hover:bg-secondary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Consultation</span>
                </button>

                {/* Secondary Actions Overflow */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={isActionLoading}
                      aria-label="Appointment options"
                      className="p-1.5 rounded-xl border border-surface-container-highest hover:bg-surface-container-high text-on-surface-variant transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 p-1.5">
                    <DropdownMenuItem
                      onClick={() => onStatusTransition(appointment, 'NO_SHOW')}
                      className="text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>Mark No-Show</span>
                    </DropdownMenuItem>
                    {onCancelClick && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onCancelClick(appointment)}
                          className="text-xs text-error focus:text-error focus:bg-error/10 flex items-center gap-2 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-error" />
                          <span>Cancel Consultation</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {isInProgress && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onStatusTransition(appointment, 'COMPLETED')}
                className="py-1.5 px-3 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Consultation</span>
              </button>
            )}

            {isPending && onCancelClick && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onCancelClick(appointment)}
                className="py-1.5 px-3 text-xs font-semibold text-error hover:bg-error/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>

      {/* Appointment Details & Lifecycle Audit Modal */}
      <AppointmentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        appointment={appointment}
        viewerRole={viewerRole}
      />
    </div>
  );
};
