"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, CornerDownLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { runGlobalSearch } from "@/lib/search/api";
import { groupResults, TYPE_ORDER } from "@/lib/search/rank";
import { useDebounce } from "@/lib/search/use-debounce";
import { recordSearchAppearances } from "@/lib/search/analytics";
import type { SearchResult, SearchEntityType } from "@/lib/search/types";
import { ResultItem } from "@/components/search/result-item";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Minimum query length before we hit the FTS RPC. */
const MIN_QUERY_LENGTH = 2;
/** Debounce window for FTS queries (matches the command palette). */
const SEARCH_DEBOUNCE_MS = 200;
/** Results fetched per entity type for the inline preview. */
const RESULTS_PER_TYPE = 5;

/**
 * Entity tabs scope which result groups are shown. `all` shows every group in
 * `TYPE_ORDER`; the others narrow to a single FTS entity type. `service` and
 * `report`/`content` aren't surfaced as tabs (per HomeSearch.tabs contract) but
 * still appear under the `all` tab.
 */
type EntityTab = "all" | "companies" | "products" | "opportunities";

const TAB_TO_ENTITY: Record<Exclude<EntityTab, "all">, SearchEntityType> = {
  companies: "company",
  products: "product",
  opportunities: "opportunity",
};

const TAB_ORDER: EntityTab[] = ["all", "companies", "products", "opportunities"];

/**
 * Search-forward home panel (customer note 1). A prominent, always-visible
 * search box backed by the same `global_search` RPC the Cmd+K palette uses
 * (`runGlobalSearch`), with entity tabs and grouped inline results. Enter routes
 * to the best match (top-ranked result href) or falls back to `/companies?q=`.
 * Keyboard accessible: input is a real `<input>`, results are anchors, and
 * Escape blurs/clears the open preview.
 */
export function HomeSearchPanel() {
  const t = useTranslations("HomeSearch");
  const locale = useLocale() as "en" | "fr";
  const router = useRouter();

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<EntityTab>("all");
  const [focused, setFocused] = useState(false);
  const [settled, setSettled] = useState<{ term: string; rows: SearchResult[] }>({
    term: "",
    rows: [],
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounce(q, SEARCH_DEBOUNCE_MS);
  const trimmed = debouncedQ.trim();
  const shouldSearch = trimmed.length >= MIN_QUERY_LENGTH;

  // Run the debounced FTS query and report appearances to analytics. State is
  // only mutated inside the async callback / cleanup (never synchronously) so we
  // never trigger a cascading render — same discipline as CommandPalette.
  useEffect(() => {
    if (!shouldSearch) return;
    let cancelled = false;
    const supabase = createClient();
    runGlobalSearch(supabase, trimmed, locale, RESULTS_PER_TYPE)
      .then((rows) => {
        if (cancelled) return;
        setSettled({ term: trimmed, rows });
        if (rows.length > 0) {
          void recordSearchAppearances(
            trimmed,
            rows.map((r) => ({ entityType: r.entity_type, entityId: r.entity_id })),
          );
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[HomeSearchPanel] search failed", error);
        setSettled({ term: trimmed, rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [shouldSearch, trimmed, locale]);

  // Close the inline preview on outside click so the panel doesn't trap focus.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const resultsAreCurrent = settled.term === trimmed;
  const grouped = useMemo(
    () => groupResults(resultsAreCurrent ? settled.rows : []),
    [resultsAreCurrent, settled.rows],
  );

  // Which entity groups to render for the active tab.
  const visibleTypes = useMemo<SearchEntityType[]>(() => {
    if (tab === "all") return TYPE_ORDER;
    return [TAB_TO_ENTITY[tab]];
  }, [tab]);

  const visibleRows = useMemo(
    () => visibleTypes.flatMap((type) => grouped[type]),
    [visibleTypes, grouped],
  );

  const hasResults = shouldSearch && resultsAreCurrent && visibleRows.length > 0;
  const loading = shouldSearch && !resultsAreCurrent;
  const showPanel = focused && shouldSearch;

  function goToBestMatch() {
    const term = q.trim();
    if (!term) return;
    // Best match = top-ranked visible row; fall back to the companies list.
    const best = visibleRows[0] ?? settled.rows[0];
    if (best) {
      router.push(best.href);
    } else {
      router.push(`/companies?q=${encodeURIComponent(term)}`);
    }
    setFocused(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      goToBestMatch();
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Entity tabs */}
      <div
        role="tablist"
        aria-label={t("title")}
        className="mb-3 flex flex-wrap gap-2"
      >
        {TAB_ORDER.map((value) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-out",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {t(`tabs.${value}`)}
            </button>
          );
        })}
      </div>

      {/* Search box */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm focus-within:border-primary transition-colors duration-150 ease-out">
        <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onInputKeyDown}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="h-11 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={goToBestMatch}
          className="shrink-0 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 ease-out hover:bg-primary/90"
        >
          {t("submitCta")}
        </button>
      </div>

      {/* Inline results preview */}
      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover p-2 text-sm shadow-md">
          {loading && !hasResults && (
            <p className="flex items-center gap-2 px-3 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              <span>{t("searching")}</span>
            </p>
          )}

          {!loading && !hasResults && (
            <p className="px-3 py-6 text-muted-foreground">{t("noResults")}</p>
          )}

          {hasResults &&
            visibleTypes.map((type: SearchEntityType) => {
              const rows = grouped[type];
              if (!rows.length) return null;
              return (
                <section key={type} className="mb-2">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t(`tabs.${entityTabKey(type)}`)}
                  </div>
                  {rows.map((r) => (
                    <ResultItem
                      key={`${type}:${r.entity_id}`}
                      item={r}
                      onSelect={() => setFocused(false)}
                    />
                  ))}
                </section>
              );
            })}

          {q.trim().length > 0 && (
            <button
              type="button"
              onClick={goToBestMatch}
              className="mt-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-primary transition-colors duration-150 ease-out hover:bg-muted"
            >
              <span>{t("submitCta")}</span>
              <CornerDownLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Map an FTS entity type to the closest HomeSearch.tabs key for the group header.
 * Types without a dedicated tab (service/report/content) fall under "all".
 */
function entityTabKey(type: SearchEntityType): EntityTab {
  switch (type) {
    case "company":
      return "companies";
    case "product":
      return "products";
    case "opportunity":
      return "opportunities";
    default:
      return "all";
  }
}
