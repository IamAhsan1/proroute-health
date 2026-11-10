import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // "MON", "TUE"
  dayNumber: string; // "14"
  monthName: string; // "NOV"
  hasSlots: boolean;
  isToday: boolean;
}

interface DateCalendarStripProps {
  days: CalendarDay[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

export const DateCalendarStrip: React.FC<DateCalendarStripProps> = ({
  days,
  selectedDate,
  onSelectDate,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Scroll Left Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => scroll('left')}
        aria-label="Scroll dates left"
        className="hidden sm:flex h-8 w-8 rounded-full border border-surface-container-highest shrink-0 mr-1 text-on-surface-variant hover:text-on-surface"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Date Chips Horizontal Scrollable Strip */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar select-none"
      >
        {days.map((day) => {
          const isSelected = selectedDate === day.dateStr;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[64px] sm:min-w-[70px] py-2.5 px-2 rounded-2xl border transition-all text-center relative ${
                isSelected
                  ? 'bg-primary text-on-primary border-primary shadow-md scale-105 ring-2 ring-primary/20'
                  : 'bg-surface-container border-surface-container-highest/80 hover:bg-surface-container-high text-on-surface hover:border-primary/40'
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${
                  isSelected ? 'text-on-primary/90' : 'text-on-surface-variant'
                }`}
              >
                {day.dayName}
              </span>
              <span className="text-base font-extrabold my-0.5">{day.dayNumber}</span>
              <span
                className={`text-[10px] font-semibold ${
                  isSelected ? 'text-on-primary/80' : 'text-on-surface-variant/80'
                }`}
              >
                {day.monthName}
              </span>

              {/* Indicator dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isSelected
                    ? 'bg-on-primary'
                    : day.hasSlots
                    ? 'bg-primary'
                    : 'bg-surface-container-highest'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => scroll('right')}
        aria-label="Scroll dates right"
        className="hidden sm:flex h-8 w-8 rounded-full border border-surface-container-highest shrink-0 ml-1 text-on-surface-variant hover:text-on-surface"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

