import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { RecurringDayRow } from './schedule/RecurringDayRow';
import { SlotConfigCard } from './schedule/SlotConfigCard';
import { DateOverrideList } from './schedule/DateOverrideList';
import { DateOverrideModal } from './schedule/DateOverrideModal';
import {
  availabilityService,
  DaySchedule,
  WeeklySchedule,
} from '../../../services/availability.service';

export const DoctorScheduleManager: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const scheduleQuery = useQuery({
    queryKey: ['doctor-schedule'],
    queryFn: () => availabilityService.getWeeklySchedule(),
  });

  const overridesQuery = useQuery({
    queryKey: ['doctor-overrides'],
    queryFn: () => availabilityService.getOverrides(),
  });

  // Local editing state
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state once data loads
  useEffect(() => {
    if (scheduleQuery.data && !isDirty) {
      setSchedule(scheduleQuery.data);
    }
  }, [scheduleQuery.data, isDirty]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (updated: WeeklySchedule) => availabilityService.updateWeeklySchedule(updated),
    onSuccess: (data) => {
      setSchedule(data);
      setIsDirty(false);
      setFeedback({ type: 'success', message: 'Availability schedule saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.error || 'Failed to save availability schedule',
      });
    },
  });

  // Override mutation
  const createOverrideMutation = useMutation({
    mutationFn: (data: any) => availabilityService.createOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-overrides'] });
      setFeedback({ type: 'success', message: 'Schedule override added successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: (id: string) => availabilityService.deleteOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-overrides'] });
      setFeedback({ type: 'success', message: 'Override removed successfully!' });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  // Day row update handler
  const handleDayChange = (updatedDay: DaySchedule) => {
    if (!schedule) return;
    const newDays = schedule.days.map((d) => (d.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : d));
    setSchedule({ ...schedule, days: newDays });
    setIsDirty(true);
  };

  // Slot duration update across all active days
  const handleDurationChange = (dur: 15 | 30 | 45 | 60) => {
    if (!schedule) return;
    const newDays = schedule.days.map((d) => ({ ...d, slotDuration: dur }));
    setSchedule({ ...schedule, days: newDays });
    setIsDirty(true);
  };

  // Buffer time update across all active days
  const handleBufferChange = (buf: 0 | 5 | 10 | 15) => {
    if (!schedule) return;
    const newDays = schedule.days.map((d) => ({ ...d, bufferTime: buf }));
    setSchedule({ ...schedule, days: newDays });
    setIsDirty(true);
  };

  const handleTimezoneChange = (tz: string) => {
    if (!schedule) return;
    setSchedule({ ...schedule, timezone: tz });
    setIsDirty(true);
  };

  // Quick templates
  const applyTemplate = (type: 'standard' | 'morning' | 'extended') => {
    if (!schedule) return;
    const currentDur = schedule.days[0]?.slotDuration || 30;
    const currentBuf = schedule.days[0]?.bufferTime || 5;

    let newDays: DaySchedule[] = [];
    if (type === 'standard') {
      newDays = schedule.days.map((d) => ({
        ...d,
        isActive: d.dayOfWeek >= 1 && d.dayOfWeek <= 5, // Mon-Fri
        windows: d.dayOfWeek >= 1 && d.dayOfWeek <= 5 ? [{ startTime: '09:00', endTime: '17:00' }] : [],
      }));
    } else if (type === 'morning') {
      newDays = schedule.days.map((d) => ({
        ...d,
        isActive: d.dayOfWeek >= 1 && d.dayOfWeek <= 6, // Mon-Sat
        windows: d.dayOfWeek >= 1 && d.dayOfWeek <= 6 ? [{ startTime: '08:00', endTime: '13:00' }] : [],
      }));
    } else if (type === 'extended') {
      newDays = schedule.days.map((d) => ({
        ...d,
        isActive: d.dayOfWeek >= 1 && d.dayOfWeek <= 5,
        windows:
          d.dayOfWeek >= 1 && d.dayOfWeek <= 5
            ? [
                { startTime: '09:00', endTime: '13:00' },
                { startTime: '17:00', endTime: '21:00' },
              ]
            : [],
      }));
    }

    setSchedule({
      ...schedule,
      days: newDays.map((d) => ({ ...d, slotDuration: currentDur, bufferTime: currentBuf })),
    });
    setIsDirty(true);
  };

  if (scheduleQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading clinical schedule...</span>
      </div>
    );
  }

  if (scheduleQuery.isError || !schedule) {
    return (
      <div className="p-8 text-center rounded-2xl bg-error-container/30 border border-error/30 text-on-error-container max-w-lg mx-auto mt-8">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-error" />
        <h3 className="text-base font-bold">Could not load schedule</h3>
        <p className="text-xs mt-1 text-on-surface-variant">
          Please check your doctor profile status or try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scheduleQuery.refetch()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const firstDay = schedule.days[0] || { slotDuration: 30, bufferTime: 5 };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-container-highest">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Consultation Schedule Builder
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Configure weekly recurring consultation hours, split shifts, consultation durations, and blackout leaves.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Templates */}
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value as any);
              e.target.value = '';
            }}
            className="h-9 px-3 text-xs rounded-xl border border-surface-container-highest bg-surface-container text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>
              ⚡ Quick Schedule Templates...
            </option>
            <option value="standard">Standard Mon-Fri (9:00 - 17:00)</option>
            <option value="morning">Morning Clinics (8:00 - 13:00, Mon-Sat)</option>
            <option value="extended">Split Shift (9:00-13:00 & 17:00-21:00)</option>
          </select>

          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (scheduleQuery.data) {
                  setSchedule(scheduleQuery.data);
                  setIsDirty(false);
                }
              }}
              className="gap-1.5 h-9"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => schedule && saveMutation.mutate(schedule)}
            className="gap-2 h-9 px-5 shadow-sm"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Dirty Warning Banner */}
      {isDirty && (
        <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-between text-xs text-secondary animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="font-semibold">You have unsaved changes in your weekly consultation hours.</span>
          </div>
          <span className="text-[11px] opacity-80">Don't forget to click "Save Changes"</span>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-error-container text-on-error-container border-error/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Weekly Recurring Days */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-surface-container-highest bg-surface-container shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-on-surface">Weekly Working Days & Shifts</CardTitle>
              <CardDescription className="text-xs text-on-surface-variant">
                Toggle days on/off and configure single or split consultation shifts for each day of the week.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              {schedule.days.map((day) => (
                <RecurringDayRow
                  key={`day-${day.dayOfWeek}`}
                  daySchedule={day}
                  onChange={handleDayChange}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 4 Cols: Consultation Parameters & Overrides */}
        <div className="lg:col-span-4 space-y-6">
          <SlotConfigCard
            slotDuration={firstDay.slotDuration}
            bufferTime={firstDay.bufferTime}
            timezone={schedule.timezone}
            onDurationChange={handleDurationChange}
            onBufferChange={handleBufferChange}
            onTimezoneChange={handleTimezoneChange}
          />

          <DateOverrideList
            overrides={overridesQuery.data || []}
            onDelete={async (id) => {
              await deleteOverrideMutation.mutateAsync(id);
            }}
            onAddClick={() => setIsOverrideModalOpen(true)}
          />
        </div>
      </div>

      {/* Date Override Modal */}
      <DateOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSubmit={async (data) => {
          await createOverrideMutation.mutateAsync(data);
        }}
      />
    </div>
  );
};

