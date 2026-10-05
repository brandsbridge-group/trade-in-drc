import type { BusinessRequestStatus } from "@/lib/supabase/types";

/**
 * Quick views of the console's request list: the questions staff asks of it
 * ("what must I pass on?", "what is new?"), each with its count. Pure, so the
 * counting and filtering rules are unit-tested.
 */

export const REQUEST_VIEWS = ["all", "to_forward", "new", "in_progress", "pending", "done"] as const;
export type RequestView = (typeof REQUEST_VIEWS)[number];

/** Statuses that need nothing more from staff. */
const DONE: BusinessRequestStatus[] = ["converted", "closed", "rejected"];

interface ViewRow {
  status: BusinessRequestStatus;
  target_company_id: string | null;
  forwarded_at: string | null;
}

/** Addressed to a company that has not received it yet, and still open. */
export function needsForward(row: ViewRow): boolean {
  return !!row.target_company_id && !row.forwarded_at && !DONE.includes(row.status);
}

export function inView(row: ViewRow, view: RequestView): boolean {
  switch (view) {
    case "all":
      return true;
    case "to_forward":
      return needsForward(row);
    case "done":
      return DONE.includes(row.status);
    default:
      return row.status === view;
  }
}

export function viewCounts(rows: ViewRow[]): Record<RequestView, number> {
  const counts = Object.fromEntries(REQUEST_VIEWS.map((v) => [v, 0])) as Record<RequestView, number>;
  for (const row of rows) {
    for (const view of REQUEST_VIEWS) if (inView(row, view)) counts[view] += 1;
  }
  return counts;
}

/** Share of requests staff has acted on (anything but "new"), as a whole percent. */
export function handledRate(rows: ViewRow[]): number {
  if (rows.length === 0) return 0;
  return Math.round((rows.filter((r) => r.status !== "new").length / rows.length) * 100);
}

/** Up to two initials for an avatar disc: "Anke Vermeulen" → "AV". */
export function personInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words.slice(0, 2).map((w) => w.charAt(0)).join("").toUpperCase();
}
