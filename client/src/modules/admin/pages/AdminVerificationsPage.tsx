import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorService, PendingDoctor } from '../../../services/doctor.service';
import { UserProfile } from '../../../api/client';
import { AuditMetricsCards } from '../components/AuditMetricsCards';
import { VerificationQueueTable } from '../components/VerificationQueueTable';
import { RejectionReasonModal } from '../components/RejectionReasonModal';
import {
  ShieldAlert,
  Ban,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../components/ui';

interface AdminVerificationsPageProps {
  currentUser: UserProfile | null;
}

export const AdminVerificationsPage: React.FC<AdminVerificationsPageProps> = ({ currentUser }) => {
  const queryClient = useQueryClient();

  const [rejectingDoctor, setRejectingDoctor] = useState<PendingDoctor | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch pending doctors queue
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pendingDoctors'],
    queryFn: () => doctorService.getPendingDoctors(1, 50),
    enabled: !!currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN'),
    staleTime: 1000 * 30,
  });

  const pendingDoctors = data?.pendingDoctors || [];

  // 2. Mutation for approving doctor
  const approveMutation = useMutation({
    mutationFn: (id: string) => doctorService.approveDoctor(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pendingDoctors'] });
      queryClient.invalidateQueries({ queryKey: ['approvedDoctors'] });
      setActionFeedback({
        type: 'success',
        text: res.message || 'Doctor verified and approved successfully.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to approve doctor';
      setActionFeedback({ type: 'error', text: msg });
    },
  });

  // 3. Mutation for rejecting doctor
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => doctorService.rejectDoctor(id, reason),
    onSuccess: () => {
      setRejectingDoctor(null);
      queryClient.invalidateQueries({ queryKey: ['pendingDoctors'] });
      setActionFeedback({
        type: 'success',
        text: 'Doctor application rejected with recorded audit reason.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to reject doctor';
      setActionFeedback({ type: 'error', text: msg });
    },
  });

  if (!currentUser) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Admin Access Required</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          Please sign in with administrative credentials to access the verification review portal.
        </p>
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-4">
          <Ban className="w-8 h-8" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Restricted Privilege Area</h2>
        <p className="text-on-surface-variant text-sm mt-1 max-w-sm">
          Your account role (<span className="text-primary font-semibold">{currentUser.role}</span>) does not have administrator privileges to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-semibold tracking-wide w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            DOCTOR VERIFICATION PORTAL
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface flex items-center gap-2">
            Doctor Verification & Licensure Queue
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm max-w-3xl">
            Audit submitted medical licenses against official registers. Approvals immediately list doctors in the public directory; rejections require structured clinical feedback.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['pendingDoctors'] })}
          className="gap-1.5 text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </Button>
      </div>

      {/* Metric Cards Row */}
      <AuditMetricsCards pendingCount={pendingDoctors.length} />

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-between animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-error/10 border-error/40 text-error'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-primary" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-error" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-outline hover:text-on-surface text-xs focus-visible:outline-none"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Verification Queue Table */}
      <VerificationQueueTable
        pendingDoctors={pendingDoctors}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onApprove={(id) => approveMutation.mutate(id)}
        isApproving={approveMutation.isPending}
        onStartReject={(doc) => setRejectingDoctor(doc)}
      />

      {/* Rejection Modal */}
      {rejectingDoctor && (
        <RejectionReasonModal
          doctor={rejectingDoctor}
          onClose={() => setRejectingDoctor(null)}
          onConfirm={(reason) =>
            rejectMutation.mutate({
              id: rejectingDoctor.id,
              reason,
            })
          }
          isPending={rejectMutation.isPending}
        />
      )}
    </div>
  );
};

export default AdminVerificationsPage;
