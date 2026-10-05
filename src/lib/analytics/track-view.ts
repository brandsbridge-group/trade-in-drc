import { trackEvent } from "@/lib/analytics/track-event";
import { viewDayKey } from "@/lib/analytics/view-day";

const sent = new Map<string, string>();

/** True when a view of `key` was already sent from this tab on the same calendar day. */
export function alreadyViewed(key: string, now: Date, seen: Map<string, string> = sent): boolean {
  const day = viewDayKey(now);
  if (seen.get(key) === day) return true;
  seen.set(key, day);
  return false;
}

/**
 * Record a page view from a client effect, once. React runs mount effects
 * twice in development (Strict Mode), which counted every visit double; the
 * two calls leave within milliseconds, too close for the server-side check in
 * `trackEvent` to see the first one, so the guard has to sit here too.
 */
export function trackView(entityType: "company" | "product", entityId: string): void {
  if (alreadyViewed(`${entityType}:${entityId}`, new Date())) return;
  void trackEvent(entityType, entityId, "view");
}
