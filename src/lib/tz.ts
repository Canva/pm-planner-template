// Philippine-time helpers.
//
// This tool operates on Philippine time (Asia/Manila) regardless of the
// viewer's machine timezone. Brief dates are stored as date-only values
// (persisted at UTC midnight), so they render consistently everywhere — the
// thing that varies by machine is the notion of "today"/"now", which drives
// the calendar's week boundaries, the today-highlight, and current-phase
// logic. These helpers anchor that to PH.

const PH_TZ = "Asia/Manila";

/**
 * The Philippine calendar date of an instant, returned as a local-midnight
 * Date whose Y/M/D equal the PH date. Safe to feed into date-fns (which works
 * in local time) — every value is local midnight, so comparisons are pure
 * calendar-date math.
 */
export function phCalendarDate(input: Date | string = new Date()): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split("-")
    .map(Number);
  return new Date(y, m - 1, day);
}

/** Today in Philippine time, as a local-midnight Date. */
export function todayPH(): Date {
  return phCalendarDate();
}
