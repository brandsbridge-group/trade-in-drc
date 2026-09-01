import type { SupabaseClient } from "@supabase/supabase-js";
import type { SectorOption } from "@/lib/opportunities/queries";
import {
  SECTOR_TILES,
  TAB_EVENT_TYPES,
  isEventTab,
  isEventType,
  type EventTab,
  type EventType,
} from "./event-constants";

/** A published event row (content_items where type='event'). */
export interface EventRow {
  id: string;
  slug: string;
  title_en: string | null;
  title_fr: string | null;
  excerpt_en: string | null;
  excerpt_fr: string | null;
  cover_url: string | null;
  event_type: EventType | null;
  event_start_at: string | null;
  event_end_at: string | null;
  event_location: string | null;
  organizer: string | null;
  sector_id: string | null;
  tags: string[] | null;
}

const FEATURED_TAG = "featured";
const PAST_TAG = "past";
const FEATURED_LIMIT = 3;
const PAST_LIMIT = 3;
const UPCOMING_LIMIT = 6;

const SELECT_COLUMNS =
  "id, slug, title_en, title_fr, excerpt_en, excerpt_fr, cover_url, event_type, event_start_at, event_end_at, event_location, organizer, sector_id, tags";

function hasTag(row: EventRow, tag: string): boolean {
  return Array.isArray(row.tags) && row.tags.includes(tag);
}

function byStartAsc(a: EventRow, b: EventRow): number {
  const at = a.event_start_at ? new Date(a.event_start_at).getTime() : Number.MAX_SAFE_INTEGER;
  const bt = b.event_start_at ? new Date(b.event_start_at).getTime() : Number.MAX_SAFE_INTEGER;
  return at - bt;
}

/** Active hero + tab filters parsed from the URL search params. */
export interface EventFilters {
  q?: string;
  type?: string;
  sector?: string;
  location?: string;
  date?: string;
  tab: EventTab;
}

export function parseEventFilters(sp: Record<string, string | undefined>): EventFilters {
  return {
    q: sp.q?.trim() || undefined,
    type: isEventType(sp.type) ? sp.type : undefined,
    sector: sp.sector || undefined,
    location: sp.location?.trim() || undefined,
    date: sp.date || undefined,
    tab: isEventTab(sp.tab) ? sp.tab : "all",
  };
}

export interface EventsHubData {
  featured: EventRow[];
  past: EventRow[];
  upcoming: EventRow[];
  upcomingTotal: number;
  sectorCounts: Record<string, { count: number; sectorId: string | null }>;
  sectors: SectorOption[];
}

/**
 * Load and shape everything the Events hub needs in a single pass. Only ~15
 * published rows exist, so we fetch once and split/filter in memory rather than
 * firing multiple round-trips.
 */
export async function loadEventsHubData(
  supabase: SupabaseClient,
  filters: EventFilters
): Promise<EventsHubData> {
  const [{ data: eventData }, { data: sectorData }] = await Promise.all([
    supabase
      .from("content_items")
      .select(SELECT_COLUMNS)
      .eq("type", "event")
      .eq("status", "published"),
    supabase
      .from("sectors")
      .select("id, name_en, name_fr, name_tr, name_zh, name_es")
      .order("name_en", { ascending: true }),
  ]);

  const rows = (eventData ?? []) as unknown as EventRow[];
  const sectors = (sectorData ?? []) as unknown as SectorOption[];

  const featured = rows.filter((r) => hasTag(r, FEATURED_TAG)).slice(0, FEATURED_LIMIT);
  const past = rows.filter((r) => hasTag(r, PAST_TAG)).slice(0, PAST_LIMIT);

  const upcomingAll = rows.filter((r) => !hasTag(r, PAST_TAG)).sort(byStartAsc);

  const upcoming = applyFilters(upcomingAll, filters).slice(0, UPCOMING_LIMIT);

  return {
    featured,
    past,
    upcoming,
    upcomingTotal: upcomingAll.length,
    sectorCounts: tallySectorCounts(rows, sectors),
    sectors,
  };
}

function applyFilters(rows: EventRow[], filters: EventFilters): EventRow[] {
  return rows.filter((row) => {
    if (filters.tab !== "all") {
      const allowed = TAB_EVENT_TYPES[filters.tab];
      if (!row.event_type || !allowed.includes(row.event_type)) return false;
    }
    if (filters.type && row.event_type !== filters.type) return false;
    if (filters.sector && row.sector_id !== filters.sector) return false;
    if (filters.location) {
      const loc = (row.event_location ?? "").toLowerCase();
      if (!loc.includes(filters.location.toLowerCase())) return false;
    }
    if (filters.date && row.event_start_at) {
      if (new Date(row.event_start_at) < new Date(filters.date)) return false;
    }
    if (filters.q) {
      const haystack = `${row.title_en ?? ""} ${row.title_fr ?? ""} ${row.excerpt_en ?? ""} ${row.excerpt_fr ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });
}

/**
 * Tally published events per "Events by Sector" tile. Each tile maps to the DB
 * sectors whose English name matches its keywords; we count events whose
 * sector_id belongs to any matched sector and expose the first matched sector
 * id so the tile can deep-link to `/events?sector=<id>`.
 */
function tallySectorCounts(
  rows: EventRow[],
  sectors: SectorOption[]
): Record<string, { count: number; sectorId: string | null }> {
  const result: Record<string, { count: number; sectorId: string | null }> = {};

  for (const tile of SECTOR_TILES) {
    const matchedIds = sectors
      .filter((s) => {
        const name = (s.name_en ?? "").toLowerCase();
        return tile.match.some((kw) => name.includes(kw));
      })
      .map((s) => s.id);

    const idSet = new Set(matchedIds);
    const count = rows.filter((r) => r.sector_id && idSet.has(r.sector_id)).length;
    result[tile.key] = { count, sectorId: matchedIds[0] ?? null };
  }

  return result;
}
