import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  appointmentService,
  AppointmentDto,
} from '../../../services/appointment.service';
import { AppointmentCard } from '../components/AppointmentCard';
import { CancelAppointmentModal } from '../components/CancelAppointmentModal';
import { extractApiError } from '../../../lib/apiError';
import { SupportReferenceCode } from '../../../components/ui/SupportReferenceCode';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui';

export const PatientAppointmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentDto | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

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

  const confirmHoldMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      appointmentService.confirmPendingAppointment(appointmentId),
    onSuccess: () => {
      setActionSuccessMessage('Appointment hold confirmed successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setTimeout(() => setActionSuccessMessage(null), 5000);
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
            My Consultations
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Track your upcoming and historical appointments, hold countdowns, and cancellation policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-surface-container-highest/60 transition-colors"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/doctors"
            className="py-2 px-3.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccessMessage}</span>
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
            <span>Upcoming Appointments</span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="flex items-center gap-2 py-2 px-4 text-xs font-semibold data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Past Consultations</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-medium">Loading your appointments...</span>
        </div>
      )}

      {/* Error State */}
      {isError && parsedError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs space-y-2"
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load appointments</span>
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
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">
            {activeTab === 'upcoming'
              ? 'No Upcoming Consultations'
              : 'No Past Appointments Found'}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {activeTab === 'upcoming'
              ? 'You do not have any scheduled consultations at the moment. Browse verified doctors across medical specialties to book a slot.'
              : 'Completed, expired, and cancelled appointments will appear here.'}
          </p>
          {activeTab === 'upcoming' && (
            <div className="pt-2">
              <Link
                to="/doctors"
                className="inline-flex items-center gap-1.5 py-2 px-4 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find a Doctor</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Appointment Cards List */}
      {!isLoading && !isError && appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              viewerRole="PATIENT"
              isActionLoading={confirmHoldMutation.isPending}
              onCancelClick={(selected) => setCancellingAppointment(selected)}
              onConfirmHoldClick={(selected) => confirmHoldMutation.mutate(selected.id)}
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

      {/* Cancellation Modal */}
      <CancelAppointmentModal
        isOpen={Boolean(cancellingAppointment)}
        appointment={cancellingAppointment}
        actorRole="PATIENT"
        onClose={() => setCancellingAppointment(null)}
        onSuccess={() => {
          setActionSuccessMessage('Appointment cancelled successfully.');
          setTimeout(() => setActionSuccessMessage(null), 5000);
        }}
      />
    </div>
  );
};

export default PatientAppointmentsPage;
