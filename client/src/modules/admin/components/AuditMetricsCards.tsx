import React from 'react';

interface AuditMetricsCardsProps {
  pendingCount: number;
}

export const AuditMetricsCards: React.FC<AuditMetricsCardsProps> = ({ pendingCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Metric 1 */}
      <div className="bg-surface-container/85 border border-surface-container-highest/60 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-outline uppercase">Pending Submissions</span>
          <span className="font-headline font-bold text-2xl text-amber-400 mt-1">
            {pendingCount}
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Awaiting council review</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">pending_actions</span>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-surface-container/85 border border-surface-container-highest/60 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-outline uppercase">Active Registry Check</span>
          <span className="font-headline font-bold text-2xl text-primary mt-1">
            Automated
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Strict Unique License Gate</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">gpp_good</span>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-surface-container/85 border border-surface-container-highest/60 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-outline uppercase">Security Enforcement</span>
          <span className="font-headline font-bold text-2xl text-secondary mt-1">
            Anti-Tampering
          </span>
          <span className="text-[11px] text-on-surface-variant mt-0.5">Auto-Revert on edit</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">lock_reset</span>
        </div>
      </div>
    </div>
  );
};
