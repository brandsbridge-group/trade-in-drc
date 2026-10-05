"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowLeft, ArrowUp, ListChecks, Lock, Pencil, Plus, Search, Shapes, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  matchesTerm,
  moveTerm,
  termName,
  type CategoryTerm,
  type SectorTerm,
} from "@/lib/taxonomy/terms";
import { GHOST_PILL, ICON_BUTTON, LanguageCoverage, PRIMARY_PILL, TranslationBadge, type TermTarget } from "./shared";

interface SectorTreeProps {
  sectors: SectorTerm[];
  categories: CategoryTerm[];
  /** A write is running: the tree must not be reordered meanwhile. */
  busy: boolean;
  onOpenForm: (target: TermTarget) => void;
  onDelete: (target: TermTarget) => void;
  onSpecs: (category: CategoryTerm) => void;
  onReorder: (kind: "sectors" | "categories", ids: string[]) => void;
}

/**
 * Sectors on the left, the categories of the selected one on the right — the
 * tree as sellers and buyers meet it. One pane at a time on phones.
 */
export function SectorTree({ sectors, categories, busy, onOpenForm, onDelete, onSpecs, onReorder }: SectorTreeProps) {
  const t = useTranslations("Taxonomy");
  const locale = useLocale();
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(sectors[0]?.id ?? null);
  // Phones show one pane: the sector list, or the detail of the sector just picked.
  const [detailOnPhone, setDetailOnPhone] = React.useState(false);

  const searching = query.trim().length > 0;
  const bySector = React.useMemo(() => {
    const map = new Map<string, CategoryTerm[]>();
    for (const category of categories) {
      const list = map.get(category.sector_id) ?? [];
      list.push(category);
      map.set(category.sector_id, list);
    }
    return map;
  }, [categories]);

  // A sector stays listed when it, or one of its categories, matches.
  const visibleSectors = sectors.filter(
    (s) => !searching || matchesTerm(s, query) || (bySector.get(s.id) ?? []).some((c) => matchesTerm(c, query))
  );
  const selected = visibleSectors.find((s) => s.id === selectedId) ?? visibleSectors[0] ?? null;

  const sectorCategories = selected ? (bySector.get(selected.id) ?? []) : [];
  const matching = searching ? sectorCategories.filter((c) => matchesTerm(c, query)) : sectorCategories;
  // The sector itself matched and none of its categories did: show them all.
  const shownCategories = searching && matching.length === 0 ? sectorCategories : matching;

  const sectorIds = sectors.map((s) => s.id);
  const categoryIds = sectorCategories.map((c) => c.id);

  const move = (kind: "sectors" | "categories", id: string, direction: -1 | 1) => {
    const next = moveTerm(kind === "sectors" ? sectorIds : categoryIds, id, direction);
    if (next) onReorder(kind, next);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
      {/* Sectors */}
      <section className={cn("rounded-2xl bg-white p-3 ring-1 ring-slate-200/70", detailOnPhone && "hidden lg:block")}>
        <div className="flex items-center justify-between gap-2 px-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {t("tree.sectors")} <span className="tabular-nums">· {sectors.length}</span>
          </h2>
          <button type="button" onClick={() => onOpenForm({ kind: "sectors" })} className={GHOST_PILL}>
            <Plus className="size-3.5" aria-hidden />
            {t("kinds.sectors.add")}
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.tree")}
            aria-label={t("search.tree")}
            className="h-9 w-full rounded-full bg-slate-100 pl-10 pr-4 text-[13px] text-market-navy outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-market-navy/20"
          />
        </div>

        {visibleSectors.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-slate-500">{t("search.noMatch")}</p>
        ) : (
          <ul className="mt-2 space-y-0.5">
            {visibleSectors.map((sector) => {
              const active = selected?.id === sector.id;
              const matches = searching ? (bySector.get(sector.id) ?? []).filter((c) => matchesTerm(c, query)).length : 0;
              return (
                <li key={sector.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(sector.id);
                      setDetailOnPhone(true);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-market-navy text-white" : "text-market-navy hover:bg-slate-100"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">{termName(sector, locale)}</span>
                      <span className={cn("block truncate text-xs", active ? "text-white/70" : "text-slate-500")}>
                        {t("usage.categories", { count: sector.usage.categories })} · {t("usage.companies", { count: sector.usage.companies })}
                      </span>
                    </span>
                    {matches > 0 && (
                      <span className={cn("rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-5", active ? "bg-white/15 text-white" : "bg-market-cream text-market-or-dark")}>
                        {matches}
                      </span>
                    )}
                    {sector.usage.categories === 0 && (
                      <span
                        title={t("tree.noCategoryShort")}
                        className={cn("size-2 shrink-0 rounded-full", active ? "bg-market-or-light" : "bg-amber-400")}
                      >
                        <span className="sr-only">{t("tree.noCategoryShort")}</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* The selected sector and its categories */}
      <section className={cn("min-w-0 space-y-3", !detailOnPhone && "hidden lg:block")}>
        {!selected ? (
          <p className="rounded-2xl bg-white px-4 py-14 text-center text-sm text-slate-500 ring-1 ring-slate-200/70">{t("tree.pickSector")}</p>
        ) : (
          <>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
              <button
                type="button"
                onClick={() => setDetailOnPhone(false)}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-market-navy lg:hidden"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                {t("tree.back")}
              </button>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold leading-tight text-market-navy">{termName(selected, locale)}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1" title={t("form.slugFrozen")}>
                      <Lock className="size-3" aria-hidden />
                      <code className="text-[11px]">{selected.slug}</code>
                    </span>
                    <span aria-hidden>·</span>
                    <span>{t("usage.companies", { count: selected.usage.companies })}</span>
                    <span aria-hidden>·</span>
                    <span>{t("usage.opportunities", { count: selected.usage.opportunities })}</span>
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button type="button" onClick={() => move("sectors", selected.id, -1)} disabled={busy || searching || sectorIds[0] === selected.id} aria-label={t("actions.moveUp")} title={t("actions.moveUp")} className={ICON_BUTTON}>
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => move("sectors", selected.id, 1)} disabled={busy || searching || sectorIds[sectorIds.length - 1] === selected.id} aria-label={t("actions.moveDown")} title={t("actions.moveDown")} className={ICON_BUTTON}>
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => onOpenForm({ kind: "sectors", term: selected })} aria-label={t("actions.edit")} title={t("actions.edit")} className={ICON_BUTTON}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete({ kind: "sectors", term: selected })}
                    aria-label={t("actions.delete")}
                    title={t("actions.delete")}
                    className={cn(ICON_BUTTON, "hover:bg-red-50 hover:text-red-600")}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <LanguageCoverage term={selected} />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {t("tree.categories")} <span className="tabular-nums">· {sectorCategories.length}</span>
                </h3>
                <button type="button" onClick={() => onOpenForm({ kind: "categories", sectorId: selected.id })} className={PRIMARY_PILL}>
                  <Plus className="size-4" aria-hidden />
                  {t("kinds.categories.add")}
                </button>
              </div>

              {sectorCategories.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200/70" aria-hidden>
                    <Shapes className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-market-navy">{t("tree.noCategoryTitle")}</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">{t("tree.noCategoryBody")}</p>
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {shownCategories.map((category) => {
                    const first = categoryIds[0] === category.id;
                    const last = categoryIds[categoryIds.length - 1] === category.id;
                    return (
                      <li key={category.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 ring-1 ring-slate-200/80">
                        <div className="min-w-0 flex-1 basis-[200px]">
                          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-market-navy">
                            {termName(category, locale)}
                            <TranslationBadge term={category} />
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            <code className="text-[11px]">{category.slug}</code>
                            {" · "}
                            {t("usage.products", { count: category.usage.products })}
                            {category.usage.services > 0 && ` · ${t("usage.services", { count: category.usage.services })}`}
                          </p>
                        </div>
                        <button type="button" onClick={() => onSpecs(category)} className={GHOST_PILL}>
                          <ListChecks className="size-3.5" aria-hidden />
                          {t("actions.specs")}
                          <span className="rounded-full bg-slate-100 px-1.5 text-[11px] tabular-nums leading-5 text-slate-600">{category.usage.spec_fields}</span>
                        </button>
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => move("categories", category.id, -1)} disabled={busy || searching || first} aria-label={t("actions.moveUp")} title={t("actions.moveUp")} className={ICON_BUTTON}>
                            <ArrowUp className="size-4" aria-hidden />
                          </button>
                          <button type="button" onClick={() => move("categories", category.id, 1)} disabled={busy || searching || last} aria-label={t("actions.moveDown")} title={t("actions.moveDown")} className={ICON_BUTTON}>
                            <ArrowDown className="size-4" aria-hidden />
                          </button>
                          <button type="button" onClick={() => onOpenForm({ kind: "categories", term: category })} aria-label={t("actions.edit")} title={t("actions.edit")} className={ICON_BUTTON}>
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete({ kind: "categories", term: category })}
                            aria-label={t("actions.delete")}
                            title={t("actions.delete")}
                            className={cn(ICON_BUTTON, "hover:bg-red-50 hover:text-red-600")}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
