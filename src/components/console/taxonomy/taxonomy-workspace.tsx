"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { deleteTerm, reorderTerms } from "@/app/[locale]/console/taxonomy/actions";
import { summarize, type TaxonomyOverview } from "@/lib/taxonomy/terms";
import type { TermTarget } from "./shared";
import { TaxonomyKpis } from "./taxonomy-kpis";
import { SectorTree } from "./sector-tree";
import { TermTable } from "./term-table";
import { TaxonomyHistory } from "./taxonomy-history";
import { TermSheet } from "./term-sheet";
import { SpecFieldsSheet } from "./spec-fields-sheet";
import { DeleteTermDialog } from "./delete-term-dialog";

const TABS = ["tree", "hs_codes", "tags", "history"] as const;
type Tab = (typeof TABS)[number];

/**
 * The console's taxonomy screen: indicators, then the sector → category tree,
 * HS codes, tags and the change history behind a segmented control. Every
 * entry is created and edited in a side panel; a deletion always goes through
 * the dialog that says what still uses the entry.
 */
export function TaxonomyWorkspace({ overview }: { overview: TaxonomyOverview }) {
  const t = useTranslations("Taxonomy");
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("tree");
  const [form, setForm] = React.useState<TermTarget | null>(null);
  const [removal, setRemoval] = React.useState<TermTarget | null>(null);
  // An id, not a row: the open panel follows the tree when it is refreshed.
  const [specCategoryId, setSpecCategoryId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const summary = React.useMemo(() => summarize(overview), [overview]);
  const entries = overview.sectors.length + overview.categories.length + overview.hs_codes.length + overview.tags.length;
  const specFields = overview.categories.reduce((sum, category) => sum + category.usage.spec_fields, 0);
  const counts: Record<Tab, number | null> = {
    tree: overview.sectors.length + overview.categories.length,
    hs_codes: overview.hs_codes.length,
    tags: overview.tags.length,
    history: null,
  };

  const reorder = async (kind: "sectors" | "categories", ids: string[]) => {
    setBusy(true);
    try {
      const result = await reorderTerms({ kind, ids });
      if (!result.ok) toast.error(t("errors.reorder"));
      router.refresh();
    } catch {
      toast.error(t("errors.reorder"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!removal?.term) return;
    setBusy(true);
    try {
      const result = await deleteTerm({ kind: removal.kind, id: removal.term.id });
      if (result.ok) {
        toast.success(t("toasts.deleted"));
        setRemoval(null);
      } else {
        toast.error(t(`errors.${result.error === "in_use" || result.error === "super_admin_only" || result.error === "not_authorized" ? result.error : "write_failed"}`));
      }
      // Refreshed either way: a refusal means the counts on screen were stale.
      router.refresh();
    } catch {
      toast.error(t("errors.write_failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <TaxonomyKpis summary={summary} entries={entries} specFields={specFields} />

      <div role="tablist" aria-label={t("tabs.label")} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl bg-slate-200/70 p-1">
        {TABS.map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                active ? "bg-white font-semibold text-market-navy ring-1 ring-slate-200" : "text-slate-600 hover:text-market-navy"
              )}
            >
              {t(`tabs.${key}`)}
              {counts[key] !== null && (
                <span className={cn("min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5", active ? "bg-slate-100 text-market-navy" : "bg-slate-300/50 text-slate-600")}>
                  {counts[key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "tree" && (
        <SectorTree
          sectors={overview.sectors}
          categories={overview.categories}
          busy={busy}
          onOpenForm={setForm}
          onDelete={setRemoval}
          onSpecs={(category) => setSpecCategoryId(category.id)}
          onReorder={reorder}
        />
      )}
      {tab === "hs_codes" && (
        <TermTable kind="hs_codes" terms={overview.hs_codes} sectors={overview.sectors} onOpenForm={setForm} onDelete={setRemoval} />
      )}
      {tab === "tags" && (
        <TermTable kind="tags" terms={overview.tags} sectors={overview.sectors} onOpenForm={setForm} onDelete={setRemoval} />
      )}
      {tab === "history" && <TaxonomyHistory history={overview.history} sectors={overview.sectors} categories={overview.categories} />}

      <TermSheet
        target={form}
        sectors={overview.sectors}
        hsCodes={overview.hs_codes}
        onClose={() => setForm(null)}
        onSaved={() => {
          setForm(null);
          router.refresh();
        }}
      />
      <SpecFieldsSheet
        category={overview.categories.find((category) => category.id === specCategoryId) ?? null}
        onClose={() => setSpecCategoryId(null)}
        onChanged={() => router.refresh()}
      />
      <DeleteTermDialog
        target={removal}
        canDelete={overview.can_delete}
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setRemoval(null)}
      />
    </div>
  );
}
