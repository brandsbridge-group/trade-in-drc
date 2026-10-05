/**
 * Pure rules of the public company directory (`/companies`): how the URL is
 * read, how a name search is made safe, and which page links are shown.
 */

export const DIRECTORY_PAGE_SIZE = 12;

export const DIRECTORY_SORT = { RECENT: "recent", AZ: "az" } as const;
export type DirectorySort = (typeof DIRECTORY_SORT)[keyof typeof DIRECTORY_SORT];

export interface DirectoryParams {
  q: string;
  sector: string;
  country: string;
  province: string;
  premiumOnly: boolean;
  sort: DirectorySort;
  page: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Read the directory's query string. Anything malformed falls back to "no
 * filter" instead of failing the page. `region` and `premium=1` are the names
 * older links used for the province and the Premium filter.
 */
export function parseDirectoryParams(sp: Record<string, string | string[] | undefined>): DirectoryParams {
  const one = (key: string) => {
    const value = sp[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const page = Number.parseInt(one("page"), 10);
  const sector = one("sector");
  return {
    q: one("q").slice(0, 80),
    sector: UUID.test(sector) ? sector : "",
    country: one("country").slice(0, 80),
    province: (one("province") || one("region")).slice(0, 80),
    premiumOnly: one("tier") === "premium" || one("premium") === "1",
    sort: one("sort") === DIRECTORY_SORT.AZ ? DIRECTORY_SORT.AZ : DIRECTORY_SORT.RECENT,
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

/** Escape what a visitor typed so `%`, `_` and `\` are searched literally in an ILIKE. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function pageCount(total: number, size = DIRECTORY_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/**
 * Page links to show: first, last, the current page and its neighbours, with
 * `null` standing for a gap ("…").
 */
export function pageWindow(current: number, pages: number): (number | null)[] {
  const wanted = new Set([1, pages, current - 1, current, current + 1]);
  const list = [...wanted].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

/** The directory URL for a set of filters, leaving defaults out of the query string. */
export function directoryHref(params: DirectoryParams, patch: Partial<DirectoryParams> = {}): string {
  const next = { ...params, ...patch };
  const qs = new URLSearchParams();
  if (next.q) qs.set("q", next.q);
  if (next.sector) qs.set("sector", next.sector);
  if (next.country) qs.set("country", next.country);
  if (next.province) qs.set("province", next.province);
  if (next.premiumOnly) qs.set("tier", "premium");
  if (next.sort !== DIRECTORY_SORT.RECENT) qs.set("sort", next.sort);
  if (next.page > 1) qs.set("page", String(next.page));
  const query = qs.toString();
  return query ? `/companies?${query}` : "/companies";
}
