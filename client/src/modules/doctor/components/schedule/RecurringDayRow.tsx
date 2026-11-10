import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { TimeWindowPicker } from './TimeWindowPicker';
import { DaySchedule, TimeWindow } from '../../../../services/availability.service';

interface RecurringDayRowProps {
  daySchedule: DaySchedule;
  onChange: (updated: DaySchedule) => void;
}

const DAY_NAMES = [
  { short: 'SUN', full: 'Sunday' },
  { short: 'MON', full: 'Monday' },
  { short: 'TUE', full: 'Tuesday' },
  { short: 'WED', full: 'Wednesday' },
  { short: 'THU', full: 'Thursday' },
  { short: 'FRI', full: 'Friday' },
  { short: 'SAT', full: 'Saturday' },
];

export const RecurringDayRow: React.FC<RecurringDayRowProps> = ({
  daySchedule,
  onChange,
}) => {
  const dayInfo = DAY_NAMES[daySchedule.dayOfWeek] || { short: 'DAY', full: 'Day' };

  const handleToggle = (checked: boolean) => {
    onChange({
      ...daySchedule,
      isActive: checked,
      windows: checked && daySchedule.windows.length === 0
        ? [{ startTime: '09:00', endTime: '17:00' }]
        : daySchedule.windows,
    });
  };

  const handleUpdateWindow = (index: number, updatedWindow: TimeWindow) => {
    const newWindows = [...daySchedule.windows];
    newWindows[index] = updatedWindow;
    onChange({
      ...daySchedule,
      windows: newWindows,
    });
  };

  const handleDeleteWindow = (index: number) => {
    const newWindows = daySchedule.windows.filter((_, i) => i !== index);
    onChange({
      ...daySchedule,
      windows: newWindows,
      isActive: newWindows.length > 0,
    });
  };

  const handleAddWindow = () => {
    // Determine smart default start based on last window
    const lastWindow = daySchedule.windows[daySchedule.windows.length - 1];
    let nextStart = '14:00';
    let nextEnd = '18:00';

    if (lastWindow && lastWindow.endTime < '20:00') {
      const [h, m] = lastWindow.endTime.split(':').map(Number);
      const startH = Math.min(h + 1, 22);
      const endH = Math.min(startH + 4, 23);
      nextStart = `${String(startH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      nextEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    onChange({
      ...daySchedule,
      windows: [...daySchedule.windows, { startTime: nextStart, endTime: nextEnd }],
    });
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-surface-container-highest bg-surface-container/50 hover:bg-surface-container transition-colors gap-3">
      {/* Left: Day Badge & Active Switch */}
      <div className="flex items-center gap-3 min-w-[140px]">
        <Switch
          checked={daySchedule.isActive}
          onCheckedChange={handleToggle}
          aria-label={`Toggle ${dayInfo.full} availability`}
        />
        <div>
          <span className="text-xs font-bold tracking-wider text-on-surface block">
            {dayInfo.short}
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium">
            {dayInfo.full}
          </span>
        </div>
      </div>

      {/* Right: Windows or Inactive Label */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-3 flex-wrap">
        {daySchedule.isActive ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              {daySchedule.windows.map((win, idx) => (
                <TimeWindowPicker
                  key={`win-${idx}`}
                  window={win}
                  onChange={(updated) => handleUpdateWindow(idx, updated)}
                  onDelete={() => handleDeleteWindow(idx)}
                  canDelete={daySchedule.windows.length > 1}
                />
              ))}
            </div>

            {daySchedule.windows.length < 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddWindow}
                className="text-primary hover:text-primary hover:bg-primary/10 text-xs gap-1 h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Add Shift
              </Button>
            )}
          </>
        ) : (
          <span className="text-xs text-on-surface-variant/70 italic py-1">
            Unavailable / Day Off
          </span>
        )}
      </div>
    </div>
  );
};

