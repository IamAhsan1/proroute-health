import { BadRequestError } from '../../utils/apiErrors.js';
import { SlotDto } from './availability.types.js';

export interface ExpandDoctorSlotsParams {
  timezone: string;
  rules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime: number;
    isActive: boolean;
  }[];
  overrides: {
    date: Date | string;
    isBlocked: boolean;
    customStartTime?: string | null;
    customEndTime?: string | null;
    reason?: string | null;
  }[];
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string; // YYYY-MM-DD
  currentTime?: Date;
  defaultSlotDuration?: number;
  defaultBufferTime?: number;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getSlotPeriod(minutes: number): 'morning' | 'afternoon' | 'evening' {
  if (minutes < 12 * 60) return 'morning'; // Before 12:00
  if (minutes < 17 * 60) return 'afternoon'; // 12:00 - 16:59
  return 'evening'; // 17:00 onwards
}

function formatDateToIsoString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Computes the day of week (0 = Sunday ... 6 = Saturday) for a calendar date string (YYYY-MM-DD)
 * using UTC midday to avoid any local machine timezone or midnight DST drift.
 */
export function getCalendarDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

/**
 * Creates an exact UTC Date given a calendar date string (YYYY-MM-DD),
 * minutes into the day (e.g. 540 for 09:00), and an IANA timezone.
 */
export function createUtcFromZonedTime(
  dateStr: string,
  minutesIntoDay: number,
  timeZone: string
): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const hours = Math.floor(minutesIntoDay / 60);
  const minutes = minutesIntoDay % 60;

  // Initial UTC guess
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Determine timezone offset difference using Intl.DateTimeFormat
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const getOffsetMinutes = (d: Date): number => {
      const parts = formatter.formatToParts(d);
      const partMap: Record<string, string> = {};
      for (const p of parts) {
        partMap[p.type] = p.value;
      }
      const zonedHours = parseInt(partMap.hour === '24' ? '0' : partMap.hour, 10);
      const zonedMinutes = parseInt(partMap.minute, 10);
      const zonedDay = parseInt(partMap.day, 10);

      return (zonedDay - day) * 24 * 60 + (zonedHours - hours) * 60 + (zonedMinutes - minutes);
    };

    const diffMinutes = getOffsetMinutes(utcGuess);
    const candidate = new Date(utcGuess.getTime() - diffMinutes * 60000);

    // Convergence check in case offset changes across DST transition boundary
    const secondDiff = getOffsetMinutes(candidate);
    if (secondDiff !== 0) {
      return new Date(candidate.getTime() - secondDiff * 60000);
    }

    return candidate;
  } catch {
    // Fallback if timezone string is invalid or unrecognized
    return utcGuess;
  }
}

export function expandDoctorSlots(params: ExpandDoctorSlotsParams): SlotDto[] {
  const start = new Date(params.startDateStr + 'T00:00:00.000Z');
  const end = new Date(params.endDateStr + 'T23:59:59.999Z');

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestError('Invalid date range format (YYYY-MM-DD required)');
  }

  if (start > end) {
    throw new BadRequestError('startDate cannot be after endDate');
  }

  // Maximum 14 days query limit to prevent range flood DoS
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 14) {
    throw new BadRequestError('Date range cannot exceed 14 days');
  }

  const now = params.currentTime || new Date();
  const minNoticeTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours minimum notice

  // Map overrides by date string YYYY-MM-DD
  const overridesMap = new Map<string, typeof params.overrides[0]>();
  for (const o of params.overrides) {
    const oDateStr = typeof o.date === 'string' ? o.date.slice(0, 10) : formatDateToIsoString(o.date);
    overridesMap.set(oDateStr, o);
  }

  const slots: SlotDto[] = [];

  // Iterate day by day
  const currentCursor = new Date(start);
  while (currentCursor <= end) {
    const dateStr = formatDateToIsoString(currentCursor);
    const override = overridesMap.get(dateStr);

    // 1. Check full-day blackout
    if (override?.isBlocked) {
      currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
      continue;
    }

    // 2. Identify time windows for this date
    interface WindowPlan {
      startMin: number;
      endMin: number;
      slotDuration: number;
      bufferTime: number;
    }
    const windows: WindowPlan[] = [];

    const dayOfWeek = getCalendarDayOfWeek(dateStr); // 0 = Sun..6 = Sat

    if (override && override.customStartTime && override.customEndTime) {
      // Custom hours override standard recurring rules.
      // Inherit slotDuration and bufferTime from doctor's matching day rule or default doctor rules
      const matchingRule =
        params.rules.find((r) => r.dayOfWeek === dayOfWeek && r.isActive) || params.rules[0];
      const slotDuration = params.defaultSlotDuration ?? matchingRule?.slotDuration ?? 30;
      const bufferTime = params.defaultBufferTime ?? matchingRule?.bufferTime ?? 5;

      windows.push({
        startMin: parseTimeToMinutes(override.customStartTime),
        endMin: parseTimeToMinutes(override.customEndTime),
        slotDuration,
        bufferTime,
      });
    } else {
      const matchingRules = params.rules.filter((r) => r.dayOfWeek === dayOfWeek && r.isActive);

      for (const rule of matchingRules) {
        windows.push({
          startMin: parseTimeToMinutes(rule.startTime),
          endMin: parseTimeToMinutes(rule.endTime),
          slotDuration: rule.slotDuration,
          bufferTime: rule.bufferTime,
        });
      }
    }

    // 3. Expand windows into discrete slots
    for (const win of windows) {
      let currentMinute = win.startMin;
      const step = win.slotDuration + win.bufferTime;

      while (currentMinute + win.slotDuration <= win.endMin) {
        const slotStartUtc = createUtcFromZonedTime(dateStr, currentMinute, params.timezone);
        const slotEndUtc = createUtcFromZonedTime(dateStr, currentMinute + win.slotDuration, params.timezone);

        // Enforce 2-hour advance booking notice
        if (slotStartUtc >= minNoticeTime) {
          slots.push({
            startUtc: slotStartUtc.toISOString(),
            endUtc: slotEndUtc.toISOString(),
            localStartTime: formatMinutesToTime(currentMinute),
            localEndTime: formatMinutesToTime(currentMinute + win.slotDuration),
            period: getSlotPeriod(currentMinute),
          });
        }

        currentMinute += step;
      }
    }

    currentCursor.setUTCDate(currentCursor.getUTCDate() + 1);
  }

  return slots.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}
