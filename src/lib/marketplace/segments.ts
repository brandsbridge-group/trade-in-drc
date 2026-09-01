export const SEGMENT_KEYS = [
  "manufacturer",
  "importer",
  "exporter",
  "finance",
  "logistics",
  "government",
  "public_corp",
  "facilitation",
  "investors",
] as const;

export type SegmentKey = typeof SEGMENT_KEYS[number];

export function isSegmentKey(value: unknown): value is SegmentKey {
  return typeof value === "string" && (SEGMENT_KEYS as readonly string[]).includes(value);
}

export function segmentSortIndex(key: SegmentKey): number {
  return SEGMENT_KEYS.indexOf(key);
}
