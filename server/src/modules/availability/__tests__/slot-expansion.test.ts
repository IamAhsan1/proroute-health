import { describe, it, expect } from 'vitest';
import {
  expandDoctorSlots,
  parseTimeToMinutes,
  formatMinutesToTime,
  getSlotPeriod,
  getCalendarDayOfWeek,
  createUtcFromZonedTime,
} from '../slot-expansion.service.js';
import { BadRequestError } from '../../../utils/apiErrors.js';

describe('SlotExpansionService', () => {
  describe('Helper functions', () => {
    it('parseTimeToMinutes should convert HH:mm to minutes', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('09:30')).toBe(570);
      expect(parseTimeToMinutes('13:45')).toBe(825);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('formatMinutesToTime should format minutes to HH:mm string', () => {
      expect(formatMinutesToTime(0)).toBe('00:00');
      expect(formatMinutesToTime(570)).toBe('09:30');
      expect(formatMinutesToTime(825)).toBe('13:45');
    });

    it('getSlotPeriod should classify morning, afternoon, and evening', () => {
      expect(getSlotPeriod(9 * 60)).toBe('morning'); // 09:00
      expect(getSlotPeriod(11 * 60 + 59)).toBe('morning'); // 11:59
      expect(getSlotPeriod(12 * 60)).toBe('afternoon'); // 12:00
      expect(getSlotPeriod(16 * 60 + 30)).toBe('afternoon'); // 16:30
      expect(getSlotPeriod(17 * 60)).toBe('evening'); // 17:00
      expect(getSlotPeriod(20 * 60)).toBe('evening'); // 20:00
    });
  });

  describe('expandDoctorSlots', () => {
    const fixedNow = new Date('2026-11-01T00:00:00.000Z'); // Sunday

    const standardRules = [
      {
        dayOfWeek: 1, // Monday (2026-11-02)
        startTime: '09:00',
        endTime: '11:00', // 120 minutes -> slots at 09:00, 09:35, 10:10 (with 30m slot + 5m buffer)
        slotDuration: 30,
        bufferTime: 5,
        isActive: true,
      },
    ];

    it('should generate discrete non-overlapping slots with duration and buffer', () => {
      const slots = expandDoctorSlots({
        timezone: 'Asia/Karachi',
        rules: standardRules,
        overrides: [],
        startDateStr: '2026-11-02',
        endDateStr: '2026-11-02',
        currentTime: fixedNow,
      });

      // 09:00 to 09:30 (+5m buffer -> next start 09:35)
      // 09:35 to 10:05 (+5m buffer -> next start 10:10)
      // 10:10 to 10:40 (+5m buffer -> next start 10:45)
      // Next at 10:45 would end at 11:15 > 11:00, so 3 slots total.
      expect(slots).toHaveLength(3);
      expect(slots[0].localStartTime).toBe('09:00');
      expect(slots[0].localEndTime).toBe('09:30');
      expect(slots[0].period).toBe('morning');

      expect(slots[1].localStartTime).toBe('09:35');
      expect(slots[1].localEndTime).toBe('10:05');

      expect(slots[2].localStartTime).toBe('10:10');
      expect(slots[2].localEndTime).toBe('10:40');
    });

    it('should completely suppress slots on full-day blackout overrides', () => {
      const slots = expandDoctorSlots({
        timezone: 'Asia/Karachi',
        rules: standardRules,
        overrides: [
          {
            date: '2026-11-02',
            isBlocked: true,
            reason: 'Medical Conference',
          },
        ],
        startDateStr: '2026-11-02',
        endDateStr: '2026-11-02',
        currentTime: fixedNow,
      });

      expect(slots).toHaveLength(0);
    });

    it('should replace recurring rules with custom hours when non-blocked override is provided', () => {
      const slots = expandDoctorSlots({
        timezone: 'Asia/Karachi',
        rules: standardRules, // Standard is 09:00 to 11:00
        overrides: [
          {
            date: '2026-11-02',
            isBlocked: false,
            customStartTime: '14:00',
            customEndTime: '15:00', // 14:00-14:30
          },
        ],
        startDateStr: '2026-11-02',
        endDateStr: '2026-11-02',
        currentTime: fixedNow,
      });

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].localStartTime).toBe('14:00');
      expect(slots[0].period).toBe('afternoon');
    });

    it('should filter out slots that occur within 2 hours of current time', () => {
      // Set current time to 2026-11-02 at 08:00 UTC (13:00 PKT)
      const currentSimulatedTime = new Date('2026-11-02T08:00:00.000Z');

      const afternoonRules = [
        {
          dayOfWeek: 1, // Monday
          startTime: '13:00',
          endTime: '17:00',
          slotDuration: 30,
          bufferTime: 0,
          isActive: true,
        },
      ];

      const slots = expandDoctorSlots({
        timezone: 'UTC', // Using UTC for simple comparison
        rules: afternoonRules,
        overrides: [],
        startDateStr: '2026-11-02',
        endDateStr: '2026-11-02',
        currentTime: currentSimulatedTime, // 08:00 UTC, +2h notice = 10:00 UTC
      });

      // All slots between 13:00 and 17:00 are > 10:00 UTC, so all 8 slots are present
      expect(slots).toHaveLength(8);

      // Now set currentSimulatedTime to 12:30 UTC -> min notice is 14:30 UTC
      const lateTime = new Date('2026-11-02T12:30:00.000Z');
      const lateSlots = expandDoctorSlots({
        timezone: 'UTC',
        rules: afternoonRules,
        overrides: [],
        startDateStr: '2026-11-02',
        endDateStr: '2026-11-02',
        currentTime: lateTime,
      });

      // Slots before 14:30 (13:00, 13:30, 14:00) should be dropped
      expect(lateSlots.every((s) => s.localStartTime >= '14:30')).toBe(true);
      expect(lateSlots.length).toBe(5); // 14:30, 15:00, 15:30, 16:00, 16:30
    });

    it('should throw BadRequestError if date range exceeds 14 days', () => {
      expect(() =>
        expandDoctorSlots({
          timezone: 'Asia/Karachi',
          rules: standardRules,
          overrides: [],
          startDateStr: '2026-11-01',
          endDateStr: '2026-11-20', // 19 days
          currentTime: fixedNow,
        })
      ).toThrow(BadRequestError);
    });

    it('should throw BadRequestError if startDate is after endDate', () => {
      expect(() =>
        expandDoctorSlots({
          timezone: 'Asia/Karachi',
          rules: standardRules,
          overrides: [],
          startDateStr: '2026-11-10',
          endDateStr: '2026-11-05',
          currentTime: fixedNow,
        })
      ).toThrow(BadRequestError);
    });

    it('should preserve doctor custom slotDuration and bufferTime in date overrides', () => {
      const customRules = [
        {
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '12:00',
          slotDuration: 15,
          bufferTime: 5,
          isActive: true,
        },
      ];

      const slots = expandDoctorSlots({
        timezone: 'Asia/Karachi',
        rules: customRules,
        overrides: [
          {
            date: '2026-11-02',
            isBlocked: false,
            customStartTime: '14:00',
            customEndTime: '15:00', // 60 mins: 14:00-14:15, 14:20-14:35, 14:40-14:55 (3 slots with 15m duration + 5m buffer)
          },
        ],
        startDateStr: '2026-11-02',
        endDateStr: '2026-11-02',
        currentTime: fixedNow,
      });

      expect(slots).toHaveLength(3);
      expect(slots[0].localStartTime).toBe('14:00');
      expect(slots[0].localEndTime).toBe('14:15');
      expect(slots[1].localStartTime).toBe('14:20');
      expect(slots[1].localEndTime).toBe('14:35');
      expect(slots[2].localStartTime).toBe('14:40');
      expect(slots[2].localEndTime).toBe('14:55');
    });

    it('should correctly calculate getCalendarDayOfWeek deterministically', () => {
      // 2026-11-01 is Sunday (0)
      expect(getCalendarDayOfWeek('2026-11-01')).toBe(0);
      // 2026-11-02 is Monday (1)
      expect(getCalendarDayOfWeek('2026-11-02')).toBe(1);
      // 2026-11-07 is Saturday (6)
      expect(getCalendarDayOfWeek('2026-11-07')).toBe(6);
    });

    it('should handle different timezones accurately in createUtcFromZonedTime', () => {
      // 09:00 in Asia/Karachi (UTC+5) is 04:00 UTC
      const pktUtc = createUtcFromZonedTime('2026-11-02', 9 * 60, 'Asia/Karachi');
      expect(pktUtc.toISOString()).toBe('2026-11-02T04:00:00.000Z');

      // 09:00 in America/New_York (UTC-5 in Nov standard time) is 14:00 UTC
      const nyUtc = createUtcFromZonedTime('2026-11-02', 9 * 60, 'America/New_York');
      expect(nyUtc.toISOString()).toBe('2026-11-02T14:00:00.000Z');

      // 09:00 in UTC is 09:00 UTC
      const utc = createUtcFromZonedTime('2026-11-02', 9 * 60, 'UTC');
      expect(utc.toISOString()).toBe('2026-11-02T09:00:00.000Z');
    });
  });
});

