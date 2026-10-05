"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { viewDayStart } from "@/lib/analytics/view-day";
import type {
  AnalyticsEntityType,
  AnalyticsEventType,
} from "@/lib/supabase/types";

/**
 * Record a single analytics event tied to an anonymous visitor.
 *
 * `entityType`/`eventType` are the typed unions backing the `analytics_events`
 * CHECK constraints (migrations 00001 + 00021), so invalid values are caught at
 * compile time rather than failing silently in the database.
 *
 * Insert failures are LOGGED (never silently swallowed) so a CHECK violation,
 * RLS misconfig, or schema drift surfaces in server logs. Analytics is
 * best-effort: a logged failure must not break the user-facing flow that
 * triggered it, so we return a result rather than throw.
 */
export async function trackEvent(
  entityType: AnalyticsEntityType,
  entityId: string,
  eventType: AnalyticsEventType
): Promise<{ ok: boolean; error?: string }> {
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("visitor_id")?.value;
  if (!visitorId) {
    return { ok: false, error: "no_visitor_id" };
  }

  const supabase = createAdminClient();

  // One view per visitor, per page, per calendar day: a reload or a second tab
  // the same day is the same visitor looking at the same page, not a new view.
  if (eventType === "view") {
    const since = viewDayStart(new Date());
    const { data: recent } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("event_type", "view")
      .eq("visitor_id", visitorId)
      .gte("created_at", since)
      .limit(1);
    if (recent && recent.length > 0) return { ok: true };
  }

  const { error } = await supabase.from("analytics_events").insert({
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    visitor_id: visitorId,
  });

  if (error) {
    console.error(
      `[trackEvent] insert failed (${error.code ?? "unknown"}) for ${entityType}/${entityId} ${eventType}: ${error.message}`
    );
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
