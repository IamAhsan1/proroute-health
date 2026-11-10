import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { TimeWindow } from '../../../../services/availability.service';

interface TimeWindowPickerProps {
  window: TimeWindow;
  onChange: (updated: TimeWindow) => void;
  onDelete: () => void;
  canDelete: boolean;
}

// Generate 30-minute interval options
const TIME_OPTIONS = (() => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
})();

export const TimeWindowPicker: React.FC<TimeWindowPickerProps> = ({
  window,
  onChange,
  onDelete,
  canDelete,
}) => {
  const isInvalid = window.startTime >= window.endTime;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={window.startTime}
          onChange={(e) => onChange({ ...window, startTime: e.target.value })}
          aria-label="Shift start time"
          className="h-9 px-3 text-xs rounded-lg border border-surface-container-highest bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
        >
          {TIME_OPTIONS.map((time) => (
            <option key={`start-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>

        <span className="text-xs text-on-surface-variant font-medium">to</span>

        <select
          value={window.endTime}
          onChange={(e) => onChange({ ...window, endTime: e.target.value })}
          aria-label="Shift end time"
          className={`h-9 px-3 text-xs rounded-lg border bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium ${
            isInvalid ? 'border-error text-error' : 'border-surface-container-highest'
          }`}
        >
          {TIME_OPTIONS.map((time) => (
            <option key={`end-${time}`} value={time}>
              {time}
            </option>
          ))}
        </select>

        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="Remove shift window"
            className="text-on-surface-variant hover:text-error hover:bg-error/10 h-8 w-8"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {isInvalid && (
        <span className="text-[11px] text-error flex items-center gap-1 font-medium mt-0.5">
          <AlertCircle className="w-3 h-3" /> End time must be after start time
        </span>
      )}
    </div>
  );
};

