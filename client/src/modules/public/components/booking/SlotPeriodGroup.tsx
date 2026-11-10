import React from 'react';
import { Sunrise, Sun, Sunset } from 'lucide-react';
import { SlotChip } from './SlotChip';
import { SlotDto } from '../../../../services/availability.service';

interface SlotPeriodGroupProps {
  period: 'morning' | 'afternoon' | 'evening';
  slots: SlotDto[];
  selectedSlot: SlotDto | null;
  onSelectSlot: (slot: SlotDto) => void;
  displayTimezone?: string;
  clinicTimezone?: string;
}

const PERIOD_CONFIG = {
  morning: {
    label: 'Morning',
    timeRange: 'Before 12:00 PM',
    icon: Sunrise,
    color: 'text-amber-500',
  },
  afternoon: {
    label: 'Afternoon',
    timeRange: '12:00 PM - 5:00 PM',
    icon: Sun,
    color: 'text-orange-500',
  },
  evening: {
    label: 'Evening',
    timeRange: 'After 5:00 PM',
    icon: Sunset,
    color: 'text-indigo-500',
  },
};

export const SlotPeriodGroup: React.FC<SlotPeriodGroupProps> = ({
  period,
  slots,
  selectedSlot,
  onSelectSlot,
  displayTimezone,
  clinicTimezone,
}) => {
  const config = PERIOD_CONFIG[period];
  const Icon = config.icon;

  if (slots.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-surface-container-highest/60">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className="text-xs font-bold text-on-surface">{config.label}</span>
        </div>
        <span className="text-[11px] text-on-surface-variant font-medium">
          {config.timeRange}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {slots.map((slot) => (
          <SlotChip
            key={slot.startUtc}
            slot={slot}
            isSelected={selectedSlot?.startUtc === slot.startUtc}
            onSelect={onSelectSlot}
            displayTimezone={displayTimezone}
            clinicTimezone={clinicTimezone}
          />
        ))}
      </div>
    </div>
  );
};
