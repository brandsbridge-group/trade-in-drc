/**
 * A view counts once per visitor, per page, per calendar day. The day is the
 * Kinshasa one (UTC+1, no daylight saving) for every visitor, so the browser
 * guard and the server check agree on where a day starts.
 */
const VIEW_DAY_OFFSET = "+01:00";
const OFFSET_MS = 60 * 60_000;

/** The calendar day of `date`, as YYYY-MM-DD. */
export function viewDayKey(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** The instant that calendar day started, as an ISO timestamp. */
export function viewDayStart(date: Date): string {
  return new Date(`${viewDayKey(date)}T00:00:00${VIEW_DAY_OFFSET}`).toISOString();
}
