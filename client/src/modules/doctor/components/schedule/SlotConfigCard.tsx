import React from 'react';
import { Clock, Shield, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';

interface SlotConfigCardProps {
  slotDuration: 15 | 30 | 45 | 60;
  bufferTime: 0 | 5 | 10 | 15;
  timezone: string;
  onDurationChange: (duration: 15 | 30 | 45 | 60) => void;
  onBufferChange: (buffer: 0 | 5 | 10 | 15) => void;
  onTimezoneChange: (tz: string) => void;
}

const DURATION_OPTIONS: (15 | 30 | 45 | 60)[] = [15, 30, 45, 60];
const BUFFER_OPTIONS: (0 | 5 | 10 | 15)[] = [0, 5, 10, 15];

const TIMEZONES = [
  { value: 'Asia/Karachi', label: 'Pakistan Time (PKT - UTC+5)' },
  { value: 'UTC', label: 'Universal Coordinated Time (UTC)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST - UTC+4)' },
  { value: 'Europe/London', label: 'London Time (GMT/BST)' },
  { value: 'America/New_York', label: 'Eastern Time (ET - UTC-5)' },
];

export const SlotConfigCard: React.FC<SlotConfigCardProps> = ({
  slotDuration,
  bufferTime,
  timezone,
  onDurationChange,
  onBufferChange,
  onTimezoneChange,
}) => {
  return (
    <Card className="border-surface-container-highest bg-surface-container shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-bold text-on-surface">Consultation Parameters</CardTitle>
        </div>
        <CardDescription className="text-xs text-on-surface-variant">
          Control consultation length and buffer gaps between patients.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Consultation Duration */}
        <div>
          <label className="text-xs font-semibold text-on-surface block mb-2">
            Slot Duration
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {DURATION_OPTIONS.map((dur) => (
              <button
                key={`dur-${dur}`}
                type="button"
                onClick={() => onDurationChange(dur)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  slotDuration === dur
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border-surface-container-highest'
                }`}
              >
                {dur}m
              </button>
            ))}
          </div>
        </div>

        {/* Buffer Time */}
        <div>
          <label className="text-xs font-semibold text-on-surface block mb-2">
            Buffer Gap Between Consultations
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {BUFFER_OPTIONS.map((buf) => (
              <button
                key={`buf-${buf}`}
                type="button"
                onClick={() => onBufferChange(buf)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  bufferTime === buf
                    ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                    : 'bg-surface-container-high/40 text-on-surface hover:bg-surface-container-high border-surface-container-highest'
                }`}
              >
                {buf === 0 ? 'None' : `${buf}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Practitioner Timezone */}
        <div>
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-primary" /> Clinic Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="w-full h-9 px-3 text-xs rounded-lg border border-surface-container-highest bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advance Notice Rule */}
        <div className="p-3 rounded-lg bg-surface-container-high/50 border border-surface-container-highest flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-[11px] text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-on-surface">2-Hour Advance Notice Gate:</span> Patients cannot book slots commencing within 2 hours of current time.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
