/**
 * Timezone utilities for client-side multi-timezone appointment handling.
 * Leverages native browser Intl APIs for zero-dependency precision.
 */

/**
 * Automatically detects the client's local IANA timezone from the browser.
 * Falls back to 'UTC' if detection fails or runs outside a browser environment.
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formats an ISO-8601 UTC timestamp to a 12-hour AM/PM time in the specified timezone.
 * Example: '2026-11-15T04:00:00.000Z' in 'Asia/Karachi' -> '9:00 AM'
 */
export function formatZonedTime(isoUtc: string, timeZone: string): string {
  try {
    const date = new Date(isoUtc);
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoUtc.slice(11, 16);
  }
}

/**
 * Formats start and end ISO-8601 UTC timestamps into a clean time range.
 * Example: '9:00 AM - 9:30 AM'
 */
export function formatZonedRange(
  startUtc: string,
  endUtc: string,
  timeZone: string
): string {
  const start = formatZonedTime(startUtc, timeZone);
  const end = formatZonedTime(endUtc, timeZone);
  return `${start} - ${end}`;
}

/**
 * Formats an ISO-8601 UTC timestamp into a human-friendly calendar date in the specified timezone.
 * Example: 'Monday, Nov 15, 2026'
 */
export function formatZonedDate(isoUtc: string, timeZone: string): string {
  try {
    const date = new Date(isoUtc);
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoUtc.slice(0, 10);
  }
}

