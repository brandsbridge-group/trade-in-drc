/**
 * URL-param merge helpers for composable list-page filters.
 *
 * The directory / marketplace sidebar exposes several independent facets
 * (sector, segment, verification tier, location, certification) plus a sort
 * control and a full-text query. Each control must MERGE its change into the
 * existing query string rather than overwrite it, so a user can stack filters
 * and share the resulting URL. These helpers centralise that logic.
 *
 * Pages pass the resolved `searchParams` (a plain record) into each filter so
 * the links can be built server-side without a client round-trip.
 */

export type FilterParams = Record<string, string | undefined>;

/** Reset to the first page whenever a facet changes (page param removed). */
const PAGINATION_KEY = "page";

/**
 * Build an href for `basePath` that keeps every current param and sets `key`
 * to `value`. Passing `undefined`/empty `value` removes the key (the "Any"
 * choice). Always drops pagination so a new filter starts from page 1.
 */
export function mergeFilterHref(
  basePath: string,
  current: FilterParams,
  key: string,
  value: string | undefined,
): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v === undefined || v === "") continue;
    if (k === key) continue;
    if (k === PAGINATION_KEY) continue;
    next.set(k, v);
  }
  if (value !== undefined && value !== "") {
    next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
