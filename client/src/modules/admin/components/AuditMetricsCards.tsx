import React from 'react';
import { Clock, ShieldCheck, Lock } from 'lucide-react';

interface AuditMetricsCardsProps {
  pendingCount: number;
}

export const AuditMetricsCards: React.FC<AuditMetricsCardsProps> = ({ pendingCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Metric 1: Pending Applications */}
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant font-semibold">Pending Verifications</span>
          <span className="font-headline font-bold text-2xl sm:text-3xl text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Awaiting admin review</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 2: Registry Verification */}
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant font-semibold">Medical License Check</span>
          <span className="font-headline font-bold text-2xl sm:text-3xl text-primary mt-1">
            Automated
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Verified Medical Registry</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Metric 3: License Protection */}
      <div className="bg-surface-container border border-surface-container-highest rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant font-semibold">Profile Integrity</span>
          <span className="font-headline font-bold text-2xl sm:text-3xl text-secondary mt-1">
            Protected
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Changes require review</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
          <Lock className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
