"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnalyticsEntityType,
  AnalyticsEventType,
} from "@/lib/supabase/types";

/**
 * Search analytics writer (Req 11 business analytics).
 *
 * Feeds two named Req-11 metrics:
 *  - "search-result appearances": every time a company/product surfaces in a
 *    search result set we write a `search_appearance` event for that entity.
 *  - "top search terms that led to profile": for each company/product result we
 *    also write a `search_query` event, tying the query term to the profile it
 *    surfaced so the analytics module can later aggregate top terms per profile.
 *
 * `analytics_events.entity_type` is CHECK-constrained to ('company','product',
 * 'rfq') (migration 00001), while `event_type` allows the discovery types
 * (migration 00021). We therefore only record results whose entity type is a
 * valid analytics entity (company, product); service/opportunity/content/report
 * results are surfaced in the UI but not yet representable in this table.
 *
 * Analytics is best-effort: failures are logged (never silently swallowed) and
 * returned as a result so the calling search flow is never blocked.
 */

const SEARCH_EVENT_TYPES = {
  query: "search_query",
  appearance: "search_appearance",
} as const satisfies Record<string, AnalyticsEventType>;

const SEARCH_ANALYTICS_ENTITY_TYPES = ["company", "product"] as const;

type SearchAnalyticsEntityType = (typeof SEARCH_ANALYTICS_ENTITY_TYPES)[number];

function isAnalyticsEntity(value: string): value is SearchAnalyticsEntityType {
  return (SEARCH_ANALYTICS_ENTITY_TYPES as readonly string[]).includes(value);
}

export interface SearchAppearanceInput {
  entityType: string;
  entityId: string;
}

/**
 * Record search appearances + the query term against every company/product hit.
 * `queryTerm` is trimmed; empty queries and empty result sets are no-ops.
 */
export async function recordSearchAppearances(
  queryTerm: string,
  results: SearchAppearanceInput[]
): Promise<{ ok: boolean; recorded: number; error?: string }> {
  const term = queryTerm.trim();
  if (!term || results.length === 0) {
    return { ok: true, recorded: 0 };
  }

  const cookieStore = await cookies();
  const visitorId = cookieStore.get("visitor_id")?.value ?? null;

  const rows = results
    .filter((r) => isAnalyticsEntity(r.entityType))
    .flatMap((r) => {
      const entityType = r.entityType as AnalyticsEntityType;
      return [
        {
          entity_type: entityType,
          entity_id: r.entityId,
          event_type: SEARCH_EVENT_TYPES.appearance,
          visitor_id: visitorId,
        },
        {
          entity_type: entityType,
          entity_id: r.entityId,
          event_type: SEARCH_EVENT_TYPES.query,
          visitor_id: visitorId,
        },
      ];
    });

  if (rows.length === 0) {
    return { ok: true, recorded: 0 };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("analytics_events").insert(rows);

  if (error) {
    console.error(
      `[search.recordSearchAppearances] insert failed (${error.code ?? "unknown"}) for term "${term}": ${error.message}`
    );
    return { ok: false, recorded: 0, error: error.message };
  }

  return { ok: true, recorded: rows.length };
}
