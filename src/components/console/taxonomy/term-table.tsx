"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Hash, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesTerm, termName, type HsCodeTerm, type SectorTerm, type TagTerm } from "@/lib/taxonomy/terms";
import { ICON_BUTTON, PRIMARY_PILL, TranslationBadge, type TermTarget } from "./shared";

interface TermTableProps {
  kind: "hs_codes" | "tags";
  terms: (HsCodeTerm | TagTerm)[];
  sectors: SectorTerm[];
  onOpenForm: (target: TermTarget) => void;
  onDelete: (target: TermTarget) => void;
}

/** HS codes or tags: a flat, searchable list. Companies pick them on their own profile. */
export function TermTable({ kind, terms, sectors, onOpenForm, onDelete }: TermTableProps) {
  const t = useTranslations("Taxonomy");
  const locale = useLocale();
  const [query, setQuery] = React.useState("");
  const isHs = kind === "hs_codes";
  const Icon = isHs ? Hash : Tags;

  const sectorName = (id: string | null) => {
    const sector = id ? sectors.find((s) => s.id === id) : undefined;
    return sector ? termName(sector, locale) : null;
  };
  const shown = terms.filter((term) => matchesTerm(term, query));

  if (terms.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-4 py-14 text-center ring-1 ring-slate-200/70">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
          <Icon className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-market-navy">{t(`empty.${kind}.title`)}</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">{t(`empty.${kind}.body`)}</p>
        <button type="button" onClick={() => onOpenForm({ kind })} className={cn(PRIMARY_PILL, "mt-4")}>
          <Plus className="size-4" aria-hidden />
          {t(`kinds.${kind}.add`)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
        <div className="relative min-w-0 flex-1 basis-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(`search.${kind}`)}
            aria-label={t(`search.${kind}`)}
            className="h-9 w-full rounded-full bg-slate-100 pl-10 pr-4 text-[13px] text-market-navy outline-none transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-market-navy/20"
          />
        </div>
        <p className="text-xs tabular-nums text-slate-500" aria-live="polite">{t("search.results", { count: shown.length })}</p>
        <button type="button" onClick={() => onOpenForm({ kind })} className={PRIMARY_PILL}>
          <Plus className="size-4" aria-hidden />
          {t(`kinds.${kind}.add`)}
        </button>
      </div>

      <div className="console-table-card">
        <table className={cn("w-full border-collapse text-sm", isHs ? "min-w-[720px]" : "min-w-[520px]")}>
          <thead>
            <tr className="text-left">
              {isHs && <th className="py-2.5 font-medium">{t("table.code")}</th>}
              <th className="py-2.5 font-medium">{t("table.name")}</th>
              {isHs && <th className="py-2.5 font-medium">{t("table.sector")}</th>}
              <th className="py-2.5 font-medium">{t("table.usage")}</th>
              <th className="py-2.5 text-right font-medium"><span className="sr-only">{t("table.actions")}</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((term) => (
              <tr key={term.id} className="border-b transition-colors hover:bg-slate-50">
                {"code" in term && (
                  <td className="whitespace-nowrap py-3 font-mono text-[13px] font-semibold text-market-navy">
                    {term.code}
                    {term.parent_code && <span className="ml-2 font-normal text-slate-400">‹ {term.parent_code}</span>}
                  </td>
                )}
                <td className="py-3">
                  <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-market-navy">
                    {termName(term, locale)}
                    <TranslationBadge term={term} />
                  </p>
                  {"slug" in term && <code className="text-[11px] text-slate-500">{term.slug}</code>}
                </td>
                {"code" in term && (
                  <td className="py-3 text-[13px] text-slate-600">{sectorName(term.sector_id) ?? <span className="text-slate-400">{t("table.noSector")}</span>}</td>
                )}
                <td className="whitespace-nowrap py-3 text-[13px] tabular-nums text-slate-600">{t("usage.companies", { count: term.usage.companies })}</td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <button type="button" onClick={() => onOpenForm({ kind, term })} aria-label={t("actions.edit")} title={t("actions.edit")} className={ICON_BUTTON}>
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => onDelete({ kind, term })} aria-label={t("actions.delete")} title={t("actions.delete")} className={cn(ICON_BUTTON, "hover:bg-red-50 hover:text-red-600")}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={isHs ? 5 : 3} className="px-3 py-10 text-center text-xs text-slate-500">{t("search.noMatch")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
