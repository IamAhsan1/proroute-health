import React from 'react';
import { DoctorProfile } from '../../../services/doctor.service';

interface VerificationStatusCardProps {
  profile?: DoctorProfile;
  isEmailVerified: boolean;
}

export const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  profile,
  isEmailVerified,
}) => {
  const status = profile?.verificationStatus || 'PENDING';

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Status Pill Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">badge</span>
            Medical Credentials & Profile
          </h1>

          {/* Dynamic Status Pill */}
          <div className="flex items-center gap-2">
            {status === 'APPROVED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-mono font-semibold border border-primary/30">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                APPROVED & LIVE
              </span>
            )}
            {status === 'PENDING' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-mono font-semibold border border-amber-500/30">
                <span className="material-symbols-outlined text-[16px]">pending</span>
                UNDER VERIFICATION REVIEW
              </span>
            )}
            {status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/15 text-error text-xs font-mono font-semibold border border-error/30">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                REJECTED
              </span>
            )}
          </div>
        </div>
        <p className="text-on-surface-variant text-xs sm:text-sm">
          Maintain your official medical licensure and board certifications. Unverified or rejected profiles are strictly isolated from patient discovery.
        </p>
      </div>

      {/* Email Verification Alert Banner */}
      {!isEmailVerified && (
        <div className="bg-error-container/40 border border-error/60 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-[22px] shrink-0 mt-0.5">
            mark_email_unread
          </span>
          <div className="flex-1 flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-on-surface">Email Verification Required</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              You must verify your email address before administrative review can process your credentials. Check your inbox for the activation link.
            </p>
          </div>
        </div>
      )}

      {/* Rejection Notice Banner */}
      {status === 'REJECTED' && profile?.rejectionReason && (
        <div className="bg-surface-container border-l-4 border-error rounded-r-xl p-4 flex items-start gap-3 shadow-md">
          <span className="material-symbols-outlined text-error text-[22px] shrink-0">
            gpp_bad
          </span>
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
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
            info
          </span>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">Anti-Tampering Guard:</strong> Any modification to your Medical License Number, Licensing Board, or Clinical Specialty will immediately reset your verification status to <span className="text-amber-400 font-semibold">PENDING</span> until re-audited by platform administrators.
          </p>
        </div>
      )}
    </div>
  );
};
