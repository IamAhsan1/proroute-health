import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  FileText,
  Building2,
  XCircle,
  History,
  Phone,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import {
  AppointmentDto,
  appointmentService,
} from '../../../services/appointment.service';
import {
  getUserTimezone,
  formatZonedDate,
  formatZonedRange,
} from '../../../lib/timezone';
import { getStatusBadgeConfig } from './AppointmentCard';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentDto | null;
  viewerRole?: 'PATIENT' | 'DOCTOR';
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  viewerRole: _viewerRole = 'PATIENT',
}) => {
  const appointmentId = appointment?.id;

  // Fetch full details with statusHistory
  const { data: detailData } = useQuery<AppointmentDto>({
    queryKey: ['appointmentDetail', appointmentId],
    queryFn: () => appointmentService.getAppointmentById(appointmentId!),
    enabled: isOpen && !!appointmentId,
  });

  const appt = detailData || appointment;

  if (!appt) return null;

  const tz = getUserTimezone();
  const badgeConfig = getStatusBadgeConfig(appt.status);
  const BadgeIcon = badgeConfig.icon;

  const steps = [
    {
      title: 'Slot Reserved',
      status: 'PENDING',
      timestamp: appt.createdAt,
      desc: 'Temporary 10-minute hold initiated',
      completed: true,
    },
    {
      title: 'Confirmed',
      status: 'CONFIRMED',
      timestamp: appt.confirmedAt,
      desc: 'Consultation guaranteed on doctor calendar',
      completed: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(appt.status),
      active: appt.status === 'PENDING',
    },
    {
      title: 'In Consultation',
      status: 'IN_PROGRESS',
      timestamp: appt.startedAt,
      desc: 'Session active with doctor',
      completed: ['IN_PROGRESS', 'COMPLETED'].includes(appt.status),
      active: appt.status === 'CONFIRMED',
    },
    {
      title: appt.status === 'CANCELLED' ? 'Cancelled' : appt.status === 'NO_SHOW' ? 'No-Show' : 'Completed',
      status: appt.status,
      timestamp: appt.completedAt || appt.cancelledAt,
      desc:
        appt.status === 'CANCELLED'
          ? `Cancelled by ${appt.cancelledByRole || 'User'}`
          : appt.status === 'NO_SHOW'
          ? 'Patient did not attend'
          : 'Consultation successfully concluded',
      completed: ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appt.status),
      failed: ['CANCELLED', 'NO_SHOW', 'EXPIRED'].includes(appt.status),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <DialogTitle>Consultation Details</DialogTitle>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeConfig.className}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badgeConfig.label}</span>
            </span>
          </div>
          <DialogDescription className="text-xs">
            Reference ID: <span className="font-mono text-on-surface">{appt.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Doctor & Patient Overview Card */}
          <div className="rounded-xl bg-surface-container/60 border border-surface-container-highest/60 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Doctor Details */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                  Practitioner
                </span>
                <p className="font-semibold text-on-surface flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span>{appt.professional?.name || 'Assigned Specialist'}</span>
                </p>
                {appt.professional?.specialty && (
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 pl-5">
                    <Building2 className="w-3 h-3 text-outline" />
                    <span>{appt.professional.specialty.name}</span>
                  </p>
                )}
              </div>

              {/* Patient Details */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                  Patient
                </span>
                <p className="font-semibold text-on-surface flex items-center gap-1.5">
                  <User className="w-4 h-4 text-secondary shrink-0" />
                  <span>{appt.patient?.name || 'Patient'}</span>
                </p>
                {appt.patient?.phone && (
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 pl-5">
                    <Phone className="w-3 h-3 text-outline" />
                    <span>{appt.patient.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-surface-container-highest/60 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-outline text-[11px] block">Date</span>
                <span className="font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {formatZonedDate(appt.startTimeUtc, tz)}
                </span>
              </div>
              <div>
                <span className="text-outline text-[11px] block">Time Window</span>
                <span className="font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {formatZonedRange(appt.startTimeUtc, appt.endTimeUtc, tz)}
                </span>
              </div>
              <div>
                <span className="text-outline text-[11px] block">Consultation Fee</span>
                <span className="font-medium text-on-surface flex items-center gap-1 mt-0.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  {appt.consultationFee !== null && appt.consultationFee > 0
                    ? `$${appt.consultationFee}`
                    : 'Free Consultation'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {appt.notes && (
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-highest/60 p-3.5 space-y-1">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-outline" />
                <span>Patient Notes &amp; Chief Complaint:</span>
              </span>
              <p className="text-xs text-on-surface-variant italic leading-relaxed">
                "{appt.notes}"
              </p>
            </div>
          )}

          {/* Cancellation Banner */}
          {appt.status === 'CANCELLED' && (
            <div className="rounded-xl bg-error/10 border border-error/20 p-3.5 space-y-1 text-xs text-error">
              <span className="font-semibold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Cancelled by {appt.cancelledByRole || 'User'}</span>
              </span>
              {appt.cancellationReason && (
                <p className="italic text-error/90 pl-5">
                  Reason: "{appt.cancellationReason}"
                </p>
              )}
            </div>
          )}

          {/* Lifecycle Stepper */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-outline" />
              <span>Lifecycle Timeline</span>
            </h4>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
              {steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      step.failed
                        ? 'bg-error text-on-error border-error'
                        : step.completed
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container border-surface-container-highest text-outline'
                    }`}
                  >
                    {step.failed ? '✕' : step.completed ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-semibold ${
                          step.completed
                            ? 'text-on-surface'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        {step.title}
                      </p>
                      {step.timestamp && (
                        <span className="text-[10px] font-mono text-outline">
                          {new Date(step.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Granular Audit Logs if statusHistory present */}
          {appt.statusHistory && appt.statusHistory.length > 0 && (
            <div className="rounded-xl bg-surface-container-lowest border border-surface-container-highest/60 p-3 space-y-2">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                Audit Log Entries ({appt.statusHistory.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {appt.statusHistory.map((item) => (
                  <div
                    key={item.id}
                    className="text-[11px] flex items-center justify-between gap-2 py-1 border-b border-surface-container-highest/40 last:border-b-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-outline text-[10px]">
                        {item.fromStatus ? `${item.fromStatus} →` : 'INIT →'}
                      </span>
                      <span className="font-semibold text-on-surface">{item.toStatus}</span>
                      {item.reason && (
                        <span className="text-on-surface-variant italic truncate max-w-xs">
                          ({item.reason})
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-outline shrink-0">
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-surface-container-highest/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-container-highest/70 hover:bg-surface-container-highest text-on-surface transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
