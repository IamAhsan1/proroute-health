import React from 'react';
import { PendingDoctor } from '../../../services/doctor.service';
import {
  FileText,
  AlertCircle,
  CheckCheck,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';

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
    <div className="bg-surface-container border border-surface-container-highest rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 bg-surface-container-high/60 border-b border-surface-container-highest flex items-center justify-between">
        <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Applicant Licensure Submissions
        </h3>
        <span className="text-xs text-outline">
          Showing {pendingDoctors.length} pending doctors
        </span>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-outline animate-pulse text-xs font-mono">
          Loading pending verification queue...
        </div>
      ) : isError ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center text-error">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="font-headline font-semibold text-sm text-error">Failed to Load Verification Queue</h4>
          <p className="text-on-surface-variant text-xs max-w-sm">
            {(error as any)?.response?.data?.message || (error as any)?.message || 'An error occurred while communicating with the verification service.'}
          </p>
        </div>
      ) : pendingDoctors.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CheckCheck className="w-6 h-6 text-primary" />
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
              <tr className="bg-surface-container-low text-on-surface-variant font-semibold text-[12px] border-b border-surface-container-highest">
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">License / Board</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Experience & Fee</th>
                <th className="py-3 px-4">Credentials</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest/50">
              {pendingDoctors.map((doc) => {
                const doctorName = doc.user?.name || (doc as any).name || 'Dr. Unknown';
                const doctorEmail = doc.user?.email || (doc as any).email || 'No Email';
                const isVerified = doc.user?.isEmailVerified ?? (doc as any).isEmailVerified ?? false;

                return (
                  <tr key={doc.id} className="hover:bg-surface-container-high/40 transition-colors">
                    {/* Doctor Name & Email */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface text-sm">{doctorName}</span>
                        <span className="text-[11px] text-outline font-mono">{doctorEmail}</span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5 font-medium">
                            <CheckCircle className="w-3 h-3 text-primary" />
                            Email Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-error mt-0.5 font-medium">
                            <AlertTriangle className="w-3 h-3 text-error" />
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
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <Stethoscope className="w-3 h-3" />
                          {doc.specialty.name}
                        </Badge>
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
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View PDF
                        </a>
                      ) : (
                        <span className="text-outline italic">No attachment</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => onApprove(doc.id)}
                          disabled={isApproving || !doc.licenseNumber}
                          className="gap-1 text-xs font-semibold h-8"
                          title={!doc.licenseNumber ? 'Cannot approve doctor without license number' : 'Approve medical registration'}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStartReject(doc)}
                          className="gap-1 text-xs font-semibold text-error hover:text-error hover:bg-error/10 border-error/30 h-8"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
