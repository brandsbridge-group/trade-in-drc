"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseChangeAction, termName, type CategoryTerm, type SectorTerm, type TaxonomyChange } from "@/lib/taxonomy/terms";

const VERB_DOT = { insert: "bg-emerald-500", update: "bg-blue-500", delete: "bg-red-500" } as const;

/** Tables the audit trigger watches; anything else in the log is skipped. */
const TABLES = ["sectors", "categories", "hs_codes", "tags", "category_spec_fields"] as const;
/** Columns whose old and new value read well side by side. */
const NAMED_FIELDS = ["name_en", "name_fr", "name_es", "name_tr", "name_zh", "label_en", "label_fr", "unit", "parent_code"];
const OTHER_FIELDS = ["sector_id", "field_type", "options", "required"];

/**
 * The last changes made to the taxonomy, read from `audit_log` (written by the
 * triggers of 00066, so a change made outside this screen appears too).
 */
export function TaxonomyHistory({ history, sectors, categories }: { history: TaxonomyChange[]; sectors: SectorTerm[]; categories: CategoryTerm[] }) {
  const t = useTranslations("Taxonomy.history");
  const locale = useLocale();
  const format = useFormatter();

  const rows = history.flatMap((change) => {
    const parsed = parseChangeAction(change.action);
    if (!parsed || !(TABLES as readonly string[]).includes(parsed.table)) return [];
    return [{ change, table: parsed.table as (typeof TABLES)[number], verb: parsed.verb }];
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-4 py-14 text-center ring-1 ring-slate-200/70">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>
          <History className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium text-market-navy">{t("emptyTitle")}</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">{t("emptyBody")}</p>
      </div>
    );
  }

  /** Where the entry sits: the category of a field, the sector of a category. */
  const context = (change: TaxonomyChange) => {
    const category = categories.find((c) => c.id === change.metadata?.category_id);
    if (category) return termName(category, locale);
    const sector = sectors.find((s) => s.id === change.metadata?.sector_id);
    return sector ? termName(sector, locale) : null;
  };

  return (
    <div className="rounded-2xl bg-white p-2 ring-1 ring-slate-200/70">
      <ul className="divide-y divide-slate-100">
        {rows.map(({ change, table, verb }) => {
          const changes = Object.entries(change.metadata?.changes ?? {});
          const where = context(change);
          return (
            <li key={change.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-3">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", VERB_DOT[verb])} aria-hidden />
              <div className="min-w-0 flex-1 basis-[240px]">
                <p className="text-[13.5px] text-slate-700">
                  <span className="font-semibold text-market-navy">{t(`actions.${table}.${verb}`)}</span>
                  {" · "}
                  {change.summary ?? "—"}
                  {where && <span className="text-slate-500"> ({where})</span>}
                </p>
                {changes.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                    {changes.map(([field, value]) => {
                      const label = NAMED_FIELDS.includes(field) || OTHER_FIELDS.includes(field) ? t(`fields.${field}`) : field;
                      const readable = NAMED_FIELDS.includes(field);
                      return (
                        <li key={field} className="break-words">
                          {label}
                          {readable && (
                            <>
                              {" : "}
                              <span className="line-through decoration-slate-300">{String(value.from ?? "—")}</span>
                              {" → "}
                              <span className="font-medium text-slate-700">{String(value.to ?? "—")}</span>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <p className="shrink-0 text-right text-xs text-slate-500">
                <span className="block font-medium text-slate-700">{change.actor_name ?? t("system")}</span>
                <time dateTime={change.created_at} className="tabular-nums">
                  {format.dateTime(new Date(change.created_at), { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
