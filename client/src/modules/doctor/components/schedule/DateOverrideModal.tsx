import React, { useState } from 'react';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';

interface DateOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    isBlocked: boolean;
    customStartTime?: string | null;
    customEndTime?: string | null;
    reason?: string | null;
  }) => Promise<void>;
}

export const DateOverrideModal: React.FC<DateOverrideModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrow);
  const [isBlocked, setIsBlocked] = useState(true);
  const [customStartTime, setCustomStartTime] = useState('10:00');
  const [customEndTime, setCustomEndTime] = useState('14:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!isBlocked && customStartTime >= customEndTime) {
      setError('Custom start time must be before end time');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        date,
        isBlocked,
        customStartTime: isBlocked ? null : customStartTime,
        customEndTime: isBlocked ? null : customEndTime,
        reason: reason.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save schedule override');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-xl border border-surface-container-highest animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-highest">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface">Add Schedule Override</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2 border border-error/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Target Date */}
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1.5">
              Select Calendar Date
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full h-10 px-3 text-xs rounded-xl border border-surface-container-highest bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            />
          </div>

          {/* Blackout Toggle */}
          <div className="p-3.5 rounded-xl border border-surface-container-highest bg-surface-container-high/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface block">
                Full-Day Blackout / Leave
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Mark as completely unavailable for appointments
              </span>
            </div>
            <Switch checked={isBlocked} onCheckedChange={setIsBlocked} />
          </div>

          {/* Custom Hours (if not blocked) */}
          {!isBlocked && (
            <div className="space-y-2 p-3.5 rounded-xl border border-secondary/30 bg-secondary/5 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-secondary block">
                Custom Working Hours for This Date
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs rounded-lg border border-surface-container-highest bg-surface-container text-on-surface"
                />
                <span className="text-xs text-on-surface-variant">to</span>
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="flex-1 h-9 px-3 text-xs rounded-lg border border-surface-container-highest bg-surface-container text-on-surface"
                />
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="text-xs font-semibold text-on-surface block mb-1.5">
              Reason / Public Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. National Holiday, Medical Conference, Personal Leave"
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-surface-container-highest bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Override'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

