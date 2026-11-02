import React, { useState } from 'react';
import { DoctorProfile } from '../../../services/doctor.service';
import { api } from '../../../api/client';
import {
  CheckCircle,
  Clock,
  XCircle,
  MailWarning,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button, Badge } from '../../../components/ui';

interface VerificationStatusCardProps {
  profile?: DoctorProfile;
  isEmailVerified: boolean;
  userEmail?: string;
}

export const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  profile,
  isEmailVerified,
  userEmail,
}) => {
  const status = profile?.verificationStatus || 'PENDING';
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = async () => {
    if (!userEmail) return;
    setResending(true);
    setResendStatus(null);
    try {
      await api.resendVerification({ email: userEmail });
      setResendStatus('Fresh link sent to your inbox!');
    } catch {
      setResendStatus('Failed to resend. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Status Pill Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface">
            Medical Credentials & Profile
          </h1>

          {/* Dynamic Status Pill */}
          <div className="flex items-center gap-2">
            {status === 'APPROVED' && (
              <Badge variant="default" className="gap-1.5 px-3 py-1 font-mono text-xs bg-primary/15 text-primary border-primary/30">
                <CheckCircle className="w-3.5 h-3.5" />
                APPROVED & LIVE
              </Badge>
            )}
            {status === 'PENDING' && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1 font-mono text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                <Clock className="w-3.5 h-3.5" />
                UNDER REVIEW
              </Badge>
            )}
            {status === 'REJECTED' && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1 font-mono text-xs bg-error/15 text-error border-error/30">
                <XCircle className="w-3.5 h-3.5" />
                REJECTED
              </Badge>
            )}
          </div>
        </div>
        <p className="text-on-surface-variant text-xs sm:text-sm">
          Maintain your official medical licensure and board certifications. Unverified or rejected profiles are strictly isolated from patient discovery.
        </p>
      </div>

      {/* Email Verification Alert Banner */}
      {!isEmailVerified && (
        <div className="bg-error-container/40 border border-error/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <MailWarning className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-on-surface">Email Verification Required</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You must verify your email address before administrative review can process your credentials. Check your inbox for the activation link.
              </p>
              {resendStatus && (
                <p className="text-xs text-primary font-medium mt-1">{resendStatus}</p>
              )}
            </div>
          </div>
          {userEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={resending}
              className="shrink-0 self-start sm:self-center text-xs font-semibold"
            >
              {resending ? 'Sending...' : 'Resend Link'}
            </Button>
          )}
        </div>
      )}

      {/* Rejection Notice Banner */}
      {status === 'REJECTED' && profile?.rejectionReason && (
        <div className="bg-surface-container border-l-4 border-error rounded-r-xl p-4 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-wider text-error font-semibold">
              Medical Board Rejection Feedback
            </span>
            <p className="text-sm text-on-surface leading-relaxed">
              "{profile.rejectionReason}"
            </p>
            <span className="text-xs text-outline mt-1">
              Please update the required information below and resubmit for administrative review.
            </span>
          </div>
        </div>
      )}

      {/* Status Notice for Approved Doctors */}
      {status === 'APPROVED' && (
        <div className="bg-surface-container border-l-4 border-secondary rounded-r-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">Licensure Integrity Policy:</strong> Any updates to your Medical License Number, Licensing Board, or Clinical Specialty will place your profile into <span className="text-amber-700 dark:text-amber-400 font-semibold">PENDING</span> review until verified by administrators.
          </p>
        </div>
      )}
    </div>
  );
};
