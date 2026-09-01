import type { SearchResult, SearchEntityType } from "./types";

export const TYPE_ORDER: SearchEntityType[] = [
  "company", "product", "service", "opportunity", "report", "content",
];

export function groupResults(results: SearchResult[]): Record<SearchEntityType, SearchResult[]> {
  const out: Record<SearchEntityType, SearchResult[]> = {
    company: [], product: [], service: [], opportunity: [], content: [], report: [],
  };
  for (const r of results) {
    out[r.entity_type].push(r);
  }
  for (const k of TYPE_ORDER) out[k].sort((a, b) => b.rank - a.rank);
  return out;
}
