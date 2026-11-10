import React from 'react';
import { SlotDto } from '../../../../services/availability.service';
import { formatZonedTime } from '../../../../lib/timezone';

interface SlotChipProps {
  slot: SlotDto;
  isSelected: boolean;
  onSelect: (slot: SlotDto) => void;
  displayTimezone?: string;
  clinicTimezone?: string;
}

// Convert "09:30" or "14:15" to "09:30 AM" or "02:15 PM"
function formatToAmPm(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

export const SlotChip: React.FC<SlotChipProps> = ({
  slot,
  isSelected,
  onSelect,
  displayTimezone,
  clinicTimezone,
}) => {
  const isDifferentTz =
    Boolean(displayTimezone && clinicTimezone && displayTimezone !== clinicTimezone);

  const mainTime = displayTimezone
    ? formatZonedTime(slot.startUtc, displayTimezone)
    : formatToAmPm(slot.localStartTime);

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center flex flex-col items-center justify-center ${
        isSelected
          ? 'bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/30 scale-[1.02]'
          : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-surface-container-highest/80 hover:border-primary/50'
      }`}
    >
      <span>{mainTime}</span>
      {isDifferentTz && (
        <span
          className={`text-[9.5px] font-normal leading-tight mt-0.5 ${
            isSelected ? 'text-on-primary/80' : 'text-on-surface-variant/80'
          }`}
        >
          {formatToAmPm(slot.localStartTime)} clinic
        </span>
      )}
    </button>
  );
};
