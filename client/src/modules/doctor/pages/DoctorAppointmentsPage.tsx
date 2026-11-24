import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Users,
} from 'lucide-react';
import {
  appointmentService,
  AppointmentDto,
} from '../../../services/appointment.service';
import { AppointmentCard } from '../../patient/components/AppointmentCard';
import { CancelAppointmentModal } from '../../patient/components/CancelAppointmentModal';
import { extractApiError } from '../../../lib/apiError';
import { SupportReferenceCode } from '../../../components/ui/SupportReferenceCode';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui';

export const DoctorAppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentDto | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<{ message: string; requestId?: string } | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['my-appointments', activeTab, currentPage],
    queryFn: () =>
      appointmentService.getMyAppointments({
        scope: activeTab,
        page: currentPage,
        limit: 10,
      }),
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW';
    }) => {
      return appointmentService.updateStatus(appointmentId, status);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setActionErrorMessage(null);
      setActionSuccessMessage(
        `Consultation status updated to ${updated.status}.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    },
    onError: (err) => {
      const parsed = extractApiError(err);
      setActionErrorMessage({
        message: parsed.message,
        requestId: parsed.requestId,
      });
    },
  });

  const appointments = response?.data || [];
  const pagination = response?.pagination;
  const parsedError = isError ? extractApiError(error) : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-container-highest/60 pb-5">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">
            Consultation Queue
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage your daily patient queue, start/complete consultations, and record attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-surface-container-highest/60 transition-colors"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Action Error Alert */}
      {actionErrorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs space-y-1.5 animate-fade-in"
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionErrorMessage.message}</span>
          </div>
          {actionErrorMessage.requestId && (
            <div className="pt-1">
              <SupportReferenceCode requestId={actionErrorMessage.requestId} />
            </div>
          )}
        </div>
      )}

      {/* Radix Accessible Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as 'upcoming' | 'past');
          setCurrentPage(1);
        }}
        className="w-full"
      >
        <TabsList className="bg-surface-container-high/80 p-1 rounded-xl border border-surface-container-highest">
          <TabsTrigger
            value="upcoming"
            className="flex items-center gap-2 py-2 px-4 text-xs font-semibold data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Active & Upcoming Queue</span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="flex items-center gap-2 py-2 px-4 text-xs font-semibold data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Completed & History</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-medium">Loading clinical consultations...</span>
        </div>
      )}

      {/* Query Error State */}
      {isError && parsedError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs space-y-2"
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load consultations</span>
          </div>
          <p>{parsedError.message}</p>
          {parsedError.requestId && (
            <div className="pt-1">
              <SupportReferenceCode requestId={parsedError.requestId} />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && appointments.length === 0 && (
        <div className="text-center py-16 px-4 bg-surface rounded-2xl border border-surface-container-highest/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">
            {activeTab === 'upcoming'
              ? 'No Consultations in Queue'
              : 'No Consultation History Found'}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {activeTab === 'upcoming'
              ? 'There are currently no active patient bookings for your practice. Ensure your availability schedules and overrides are configured.'
              : 'Past consultations and cancellations will appear here for clinical audit.'}
          </p>
        </div>
      )}

      {/* Appointment Cards List */}
      {!isLoading && !isError && appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              viewerRole="DOCTOR"
              isActionLoading={transitionMutation.isPending}
              onCancelClick={(selected) => setCancellingAppointment(selected)}
              onStatusTransition={(selected, targetStatus) =>
                transitionMutation.mutate({
                  appointmentId: selected.id,
                  status: targetStatus,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest/60 text-xs text-on-surface-variant">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="py-1.5 px-3 rounded-lg border border-surface-container-highest/60 hover:bg-surface-container disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="py-1.5 px-3 rounded-lg border border-surface-container-highest/60 hover:bg-surface-container disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Cancellation Modal (Doctor cancellation requires mandatory reason) */}
      <CancelAppointmentModal
        isOpen={Boolean(cancellingAppointment)}
        appointment={cancellingAppointment}
        actorRole="DOCTOR"
        onClose={() => setCancellingAppointment(null)}
        onSuccess={() => {
          setActionSuccessMessage('Consultation cancelled successfully.');
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
