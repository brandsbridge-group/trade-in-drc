"use client";

import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { TERM_LOCALES, missingLocales, type AnyTerm, type TaxonomyKind, type TermNames } from "@/lib/taxonomy/terms";

/** What a form or a confirmation is opened on. `term` absent = a new entry. */
export interface TermTarget {
  kind: TaxonomyKind;
  term?: AnyTerm;
  /** Pre-selected sector of a new category. */
  sectorId?: string;
}

export const ICON_BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-market-navy disabled:pointer-events-none disabled:opacity-30";

export const PRIMARY_PILL =
  "inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep disabled:opacity-60";

export const GHOST_PILL =
  "inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-market-navy ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-60";

/** "To translate" pill, shown only when an optional language is missing. */
export function TranslationBadge({ term, className }: { term: TermNames; className?: string }) {
  const t = useTranslations("Taxonomy");
  const missing = missingLocales(term);
  if (missing.length === 0) return null;
  return (
    <span
      title={t("translation.missingIn", { languages: missing.map((locale) => t(`languages.${locale}`)).join(", ") })}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700",
        className
      )}
    >
      <Languages className="size-3" aria-hidden />
      {t("translation.missing")}
    </span>
  );
}

/** The five languages of an entry: filled when it has a name in that language. */
export function LanguageCoverage({ term }: { term: TermNames }) {
  const t = useTranslations("Taxonomy");
  const missing = new Set<string>(missingLocales(term));
  return (
    <ul className="flex flex-wrap items-center gap-1" aria-label={t("translation.coverage")}>
      {TERM_LOCALES.map((locale) => {
        const done = !missing.has(locale);
        return (
          <li
            key={locale}
            title={t(done ? "translation.has" : "translation.lacks", { language: t(`languages.${locale}`) })}
            className={cn(
              "rounded-md border border-transparent px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
              done ? "bg-emerald-50 text-emerald-700" : "border border-dashed border-slate-300 bg-white text-slate-400"
            )}
          >
            {locale}
          </li>
        );
      })}
    </ul>
  );
}
