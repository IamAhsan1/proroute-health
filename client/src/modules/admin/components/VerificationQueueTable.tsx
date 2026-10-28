import React from 'react';
import { PendingDoctor } from '../../../services/doctor.service';

interface VerificationQueueTableProps {
  pendingDoctors: PendingDoctor[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  onApprove: (id: string) => void;
  isApproving: boolean;
  onStartReject: (doc: PendingDoctor) => void;
}

export const VerificationQueueTable: React.FC<VerificationQueueTableProps> = ({
  pendingDoctors,
  isLoading,
  isError,
  error,
  onApprove,
  isApproving,
  onStartReject,
}) => {
  return (
    <div className="bg-surface-container/85 backdrop-blur-xl border border-surface-container-highest/70 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      <div className="p-4 bg-surface-container-high/60 border-b border-surface-container-highest flex items-center justify-between">
        <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">clinical_notes</span>
          Applicant Licensure Submissions
        </h3>
        <span className="text-xs font-mono text-outline">
          Showing {pendingDoctors.length} pending doctors
        </span>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-outline animate-pulse text-xs">
          Loading pending verification queue...
        </div>
      ) : isError ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[24px]">error</span>
          </div>
          <h4 className="font-headline font-semibold text-sm text-error">Failed to Load Verification Queue</h4>
          <p className="text-on-surface-variant text-xs max-w-sm">
            {(error as any)?.response?.data?.message || (error as any)?.message || 'An error occurred while communicating with the verification service.'}
          </p>
        </div>
      ) : pendingDoctors.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">done_all</span>
          </div>
          <h4 className="font-headline font-semibold text-sm text-on-surface">Queue Clear!</h4>
          <p className="text-on-surface-variant text-xs max-w-sm">
            There are no pending doctor verification applications at this time. All submissions have been processed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-mono uppercase tracking-wider text-[11px] border-b border-surface-container-highest">
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">License / Board</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Experience & Fee</th>
                <th className="py-3 px-4">Credentials</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest/50">
              {pendingDoctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-container-high/40 transition-colors">
                  {/* Doctor Name & Email */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface text-sm">{doc.user.name}</span>
                      <span className="text-[11px] text-outline font-mono">{doc.user.email}</span>
                      {doc.user.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Email Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-error mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          Email Unverified
                        </span>
                      )}
                    </div>
                  </td>

                  {/* License Number & Board */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-on-surface uppercase tracking-wider">
                        {doc.licenseNumber || (
                          <span className="text-error italic font-normal">Not Provided</span>
                        )}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {doc.medicalBoard || 'Medical Board unspecified'}
                      </span>
                    </div>
                  </td>

                  {/* Specialty */}
                  <td className="py-4 px-4">
                    {doc.specialty ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] font-medium">
                        <span className="material-symbols-outlined text-[13px]">stethoscope</span>
                        {doc.specialty.name}
                      </span>
                    ) : (
                      <span className="text-outline italic">No specialty selected</span>
                    )}
                  </td>

                  {/* Experience & Fee */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface font-mono">
                        {doc.yearsOfExperience !== null ? `${doc.yearsOfExperience} yrs exp` : 'N/A'}
                      </span>
                      <span className="text-secondary font-mono font-bold">
                        ${doc.consultationFee ? Number(doc.consultationFee).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </td>

                  {/* Document Link */}
                  <td className="py-4 px-4">
                    {doc.credentialDocumentUrl ? (
                      <a
                        href={doc.credentialDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        View PDF
                      </a>
                    ) : (
                      <span className="text-outline italic">No attachment</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => onApprove(doc.id)}
                        disabled={isApproving || !doc.licenseNumber}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-primary-fixed disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1"
                        title={!doc.licenseNumber ? 'Cannot approve doctor without license number' : 'Approve medical registration'}
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartReject(doc)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-error hover:bg-error/10 border border-error/30 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
