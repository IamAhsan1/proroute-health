import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { SupportReferenceCode } from '../../../../components/ui';
import { DateCalendarStrip, CalendarDay } from './DateCalendarStrip';
import { SlotPeriodGroup } from './SlotPeriodGroup';
import { availabilityService, SlotDto } from '../../../../services/availability.service';
import { extractApiError } from '../../../../lib/apiError';
import {
  getUserTimezone,
  formatZonedRange,
  formatZonedDate,
} from '../../../../lib/timezone';

interface DoctorSlotPickerProps {
  doctorId: string;
  consultationFee?: number | null;
  onBookSlot?: (slot: SlotDto) => void;
}

export const DoctorSlotPicker: React.FC<DoctorSlotPickerProps> = ({
  doctorId,
  consultationFee,
  onBookSlot,
}) => {
  // 1. Detect patient's local browser timezone
  const userTimezone = useMemo(() => getUserTimezone(), []);

  // 2. Generate rolling 14 days
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const now = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.toLocaleDateString('en-US', { day: 'numeric' }),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        hasSlots: false,
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const startDateStr = calendarDays[0].dateStr;
  const endDateStr = calendarDays[calendarDays.length - 1].dateStr;

  const [selectedDate, setSelectedDate] = useState<string>(startDateStr);
  const [selectedSlot, setSelectedSlot] = useState<SlotDto | null>(null);

  // Fetch slots from API
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['doctor-slots', doctorId, startDateStr, endDateStr],
    queryFn: () => availabilityService.getDoctorSlots(doctorId, startDateStr, endDateStr),
    staleTime: 60000,
  });

  const parsedError = useMemo(() => (isError ? extractApiError(error) : null), [isError, error]);

  const clinicTimezone = data?.timezone || 'UTC';
  const hasTimezoneDifference = userTimezone !== clinicTimezone;

  // View mode: 'user' (patient local) or 'clinic' (doctor's local)
  const [timezoneMode, setTimezoneMode] = useState<'user' | 'clinic'>('user');
  const activeDisplayTimezone = timezoneMode === 'user' ? userTimezone : clinicTimezone;

  const allSlots = data?.slots || [];

  // Annotate which days have slots
  const enrichedDays = useMemo(() => {
    const slotsDatesSet = new Set(allSlots.map((s) => s.startUtc.slice(0, 10)));
    return calendarDays.map((d) => ({
      ...d,
      hasSlots: slotsDatesSet.has(d.dateStr),
    }));
  }, [calendarDays, allSlots]);

  // Filter slots for currently selected date
  const selectedDateSlots = useMemo(() => {
    return allSlots.filter((s) => s.startUtc.startsWith(selectedDate));
  }, [allSlots, selectedDate]);

  const morningSlots = useMemo(
    () => selectedDateSlots.filter((s) => s.period === 'morning'),
    [selectedDateSlots]
  );
  const afternoonSlots = useMemo(
    () => selectedDateSlots.filter((s) => s.period === 'afternoon'),
    [selectedDateSlots]
  );
  const eveningSlots = useMemo(
    () => selectedDateSlots.filter((s) => s.period === 'evening'),
    [selectedDateSlots]
  );

  return (
    <Card className="border-surface-container-highest bg-surface-container shadow-md rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-surface-container-highest/60 bg-surface-container-high/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-bold text-on-surface">
              Select Consultation Time Slot
            </CardTitle>
          </div>

          {/* Timezone Indicator & Toggle */}
          {hasTimezoneDifference ? (
            <div className="flex items-center bg-surface-container-highest/80 p-1 rounded-xl border border-surface-container-highest self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setTimezoneMode('user')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                  timezoneMode === 'user'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title={`Detected from your device: ${userTimezone}`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Your Time ({userTimezone.split('/').pop()?.replace('_', ' ') || userTimezone})</span>
              </button>

              <button
                type="button"
                onClick={() => setTimezoneMode('clinic')}
                className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                  timezoneMode === 'clinic'
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title={`Doctor Clinic: ${clinicTimezone}`}
              >
                <span>Clinic ({clinicTimezone.split('/').pop()?.replace('_', ' ') || clinicTimezone})</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Timezone: {clinicTimezone} (Matches your device)</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* 14-Day Calendar Strip */}
        <div>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
            Available Dates
          </span>
          <DateCalendarStrip
            days={enrichedDays}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedSlot(null);
            }}
          />
        </div>

        {/* Slot Loading / Error / Empty / Grid States */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-on-surface-variant">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Checking real-time doctor availability...</span>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-xl bg-error-container/30 border border-error/30 text-center text-on-error-container">
            <AlertCircle className="w-6 h-6 mx-auto mb-1 text-error" />
            <p className="text-xs font-semibold">{parsedError?.message || 'Could not load available slots'}</p>
            {parsedError?.requestId && (
              <div className="mt-2.5">
                <SupportReferenceCode requestId={parsedError.requestId} />
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Retry
            </Button>
          </div>
        ) : selectedDateSlots.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-surface-container-highest text-on-surface-variant">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-on-surface-variant" />
            <p className="text-sm font-semibold text-on-surface">No appointments available on this date</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Please choose another highlighted date with an indicator dot.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <SlotPeriodGroup
              period="morning"
              slots={morningSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              displayTimezone={activeDisplayTimezone}
              clinicTimezone={clinicTimezone}
            />
            <SlotPeriodGroup
              period="afternoon"
              slots={afternoonSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              displayTimezone={activeDisplayTimezone}
              clinicTimezone={clinicTimezone}
            />
            <SlotPeriodGroup
              period="evening"
              slots={eveningSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              displayTimezone={activeDisplayTimezone}
              clinicTimezone={clinicTimezone}
            />
          </div>
        )}

        {/* Selected Slot Confirmation Banner */}
        {selectedSlot && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-on-surface">
                  Selected Time Slot: {formatZonedRange(selectedSlot.startUtc, selectedSlot.endUtc, userTimezone)}
                  {hasTimezoneDifference && ' (Your Time)'}
                </span>
              </div>

              {hasTimezoneDifference && (
                <p className="text-[11px] text-primary/90 font-medium pl-6">
                  Clinic Time: {selectedSlot.localStartTime} - {selectedSlot.localEndTime} ({clinicTimezone})
                </p>
              )}

              <p className="text-[11px] text-on-surface-variant pl-6">
                Date: {formatZonedDate(selectedSlot.startUtc, activeDisplayTimezone)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {consultationFee !== undefined && consultationFee !== null && (
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Fee</span>
                  <span className="text-sm font-extrabold text-primary">${consultationFee}</span>
                </div>
              )}

              <Button
                type="button"
                variant="clinical"
                size="default"
                onClick={() => onBookSlot?.(selectedSlot)}
                className="gap-2 font-bold px-6"
              >
                Book Appointment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
