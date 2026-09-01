"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search, X, CornerDownLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { runGlobalSearch } from "@/lib/search/api";
import { groupResults, TYPE_ORDER } from "@/lib/search/rank";
import { useDebounce } from "@/lib/search/use-debounce";
import { recordSearchAppearances } from "@/lib/search/analytics";
import { useSearchRegistry } from "@/lib/search/search-registry";
import type { SearchResult, SearchEntityType } from "@/lib/search/types";
import { ResultItem } from "./result-item";
import { useRouter } from "@/i18n/routing";

/** Minimum query length before we hit the FTS RPC. Below this we show quick actions. */
const MIN_QUERY_LENGTH = 2;
/** Debounce window for FTS queries (matches MOTION restraint; not an animation). */
const SEARCH_DEBOUNCE_MS = 200;
/** Results fetched per entity type for the inline palette preview. */
const PALETTE_RESULTS_PER_TYPE = 5;

interface CommandPaletteProps {
  /**
   * Controlled open state. When omitted the component renders nothing — the
   * canonical instance is rendered (controlled) by `SearchProvider`, so any
   * legacy uncontrolled mount in a layout is a safe no-op rather than a second
   * palette with its own state and Cmd+K listener.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Global command palette (Cmd+K). Connects the palette to Postgres full-text
 * search (`global_search` RPC, migration 00009): typing a company / product /
 * service / opportunity / content / report term returns real grouped results.
 * Navigation quick actions (Home, Dashboard, …) remain available when the query
 * is empty or too short to search. Enter / "see all results" routes to the
 * full `/search?q=` results page. Result appearances are reported to analytics
 * (Req 11) so the business-analytics module can compute top search terms.
 *
 * Rendered (controlled) by `SearchProvider`; the navbar/hero open it via
 * `useSearch().openSearch()`. The provider also owns the single Cmd+K listener.
 */
export function CommandPalette(props: CommandPaletteProps) {
  // Uncontrolled / propless mount (e.g. a legacy standalone render): no-op so we
  // never double-render the palette or register a competing Cmd+K listener.
  if (props.open === undefined || props.onOpenChange === undefined) {
    return null;
  }
  return <ControlledCommandPalette open={props.open} onOpenChange={props.onOpenChange} />;
}

function ControlledCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Search");
  const locale = useLocale() as "en" | "fr";
  const router = useRouter();

  const [q, setQ] = useState("");
  // Results are stored together with the query term that produced them. This
  // lets us derive the "searching" state (current query != settled query)
  // without a separate loading flag set synchronously inside the effect.
  const [settled, setSettled] = useState<{ term: string; rows: SearchResult[] }>({
    term: "",
    rows: [],
  });
  const debouncedQ = useDebounce(q, SEARCH_DEBOUNCE_MS);

  const { groupedItems, handleSelect } = useSearchRegistry(() =>
    onOpenChange(false)
  );
  const quickActions = useMemo(
    () => Object.values(groupedItems).flat(),
    [groupedItems]
  );

  const trimmed = debouncedQ.trim();
  const shouldSearch = trimmed.length >= MIN_QUERY_LENGTH;

  // Run the FTS query (debounced) and report appearances to analytics. State is
  // only mutated inside the async callback / cleanup — never synchronously in
  // the effect body — so we never trigger a cascading render.
  useEffect(() => {
    if (!open || !shouldSearch) return;
    let cancelled = false;
    const supabase = createClient();
    runGlobalSearch(supabase, trimmed, locale, PALETTE_RESULTS_PER_TYPE)
      .then((rows) => {
        if (cancelled) return;
        setSettled({ term: trimmed, rows });
        if (rows.length > 0) {
          void recordSearchAppearances(
            trimmed,
            rows.map((r) => ({ entityType: r.entity_type, entityId: r.entity_id }))
          );
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[CommandPalette] search failed", error);
        setSettled({ term: trimmed, rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [open, shouldSearch, trimmed, locale]);

  // A result set is current only if it was produced by the active query term.
  const resultsAreCurrent = settled.term === trimmed;
  const grouped = useMemo(
    () => groupResults(resultsAreCurrent ? settled.rows : []),
    [resultsAreCurrent, settled.rows]
  );
  const hasResults = shouldSearch && resultsAreCurrent && settled.rows.length > 0;
  // We are searching while the active query is long enough but its results have
  // not settled yet (debounce window + in-flight RPC).
  const loading = shouldSearch && !resultsAreCurrent;

  function resetState() {
    setQ("");
    setSettled({ term: "", rows: [] });
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    onOpenChange(next);
  }

  function close() {
    resetState();
    onOpenChange(false);
  }

  function goToResultsPage() {
    const term = q.trim();
    if (!term) return;
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      goToResultsPage();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className="max-w-xl p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("page.title")}</DialogTitle>
        <div className="flex items-center gap-3 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="h-9 border-0 text-sm shadow-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 text-sm">
          {/* Quick actions: shown when there is nothing to search yet. */}
          {!shouldSearch && quickActions.length > 0 && (
            <section className="mb-2">
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                {t("quickActions")}
              </div>
              {quickActions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 rounded px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  {item.icon && (
                    <span className="rounded-sm bg-muted p-1.5 text-muted-foreground">
                      <item.icon className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    {item.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </section>
          )}

          {/* Searching state. */}
          {shouldSearch && loading && !hasResults && (
            <p className="px-3 py-6 text-muted-foreground">{t("searching")}</p>
          )}

          {/* Empty state. */}
          {shouldSearch && !loading && !hasResults && (
            <p className="px-3 py-6 text-muted-foreground">{t("noResults")}</p>
          )}

          {/* Grouped FTS results. */}
          {shouldSearch &&
            hasResults &&
            TYPE_ORDER.map((type: SearchEntityType) => {
              const rows = grouped[type];
              if (!rows.length) return null;
              return (
                <section key={type} className="mb-2">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t(`groups.${type}`)}
                  </div>
                  {rows.map((r) => (
                    <ResultItem
                      key={`${type}:${r.entity_id}`}
                      item={r}
                      onSelect={close}
                    />
                  ))}
                </section>
              );
            })}

          {/* See all results — always available once a query exists. */}
          {q.trim().length > 0 && (
            <button
              type="button"
              onClick={goToResultsPage}
              className="mt-2 flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs text-primary transition-colors hover:bg-muted"
            >
              <span>{t("viewAll", { q: q.trim() })}</span>
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
