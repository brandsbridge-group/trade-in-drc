// Server-safe sort option primitives.
//
// These are pure values/helpers with NO React or client-only dependencies, so
// they can be imported and CALLED from Server Components (the directory/list
// pages resolve the `sort` search param on the server). They intentionally live
// OUTSIDE sort-control.tsx ("use client"): importing a named value from a client
// module turns it into a client reference, and invoking it on the server throws
// "Attempted to call X from the server". Keep the component client-side; keep
// these here.

export const SORT_OPTIONS = ["relevance", "az", "newest"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export function isSortOption(value: unknown): value is SortOption {
  return (
    typeof value === "string" &&
    (SORT_OPTIONS as readonly string[]).includes(value)
  );
}
