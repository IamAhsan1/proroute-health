import { describe, it, expect } from 'vitest';
import {
  getUserTimezone,
  formatZonedTime,
  formatZonedRange,
  formatZonedDate,
} from '../lib/timezone';

describe('timezone utilities', () => {
  it('detects a valid user timezone string', () => {
    const tz = getUserTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('correctly converts UTC to different regional timezones', () => {
    // 04:00 UTC on 2026-11-15
    const utcIso = '2026-11-15T04:00:00.000Z';

    // Pakistan is UTC+5 -> 09:00 AM
    const pktTime = formatZonedTime(utcIso, 'Asia/Karachi');
    expect(pktTime).toBe('9:00 AM');

    // Gulf is UTC+4 -> 08:00 AM
    const gstTime = formatZonedTime(utcIso, 'Asia/Dubai');
    expect(gstTime).toBe('8:00 AM');

    // London is UTC+0 in November -> 04:00 AM
    const gmtTime = formatZonedTime(utcIso, 'Europe/London');
    expect(gmtTime).toBe('4:00 AM');
  });

  it('formats range cleanly in specified timezone', () => {
    const startUtc = '2026-11-15T04:00:00.000Z';
    const endUtc = '2026-11-15T04:30:00.000Z';

    const range = formatZonedRange(startUtc, endUtc, 'Asia/Karachi');
    expect(range).toBe('9:00 AM - 9:30 AM');
  });

  it('formats zoned date accurately', () => {
    const startUtc = '2026-11-15T04:00:00.000Z';
    const formatted = formatZonedDate(startUtc, 'Asia/Karachi');
    expect(formatted).toContain('Nov 15, 2026');
  });
});

