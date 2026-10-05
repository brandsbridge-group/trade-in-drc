"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Building2, Languages, Layers, Shapes } from "lucide-react";
import { KpiTile } from "@/components/dashboard/overview/kpi-tile";
import type { TaxonomySummary } from "@/lib/taxonomy/terms";

/**
 * Indicators above the taxonomy: what still needs work first (the highlighted
 * tile), then the size of the tree and the companies it does not reach yet.
 */
export function TaxonomyKpis({ summary, entries, specFields }: { summary: TaxonomySummary; entries: number; specFields: number }) {
  const t = useTranslations("Taxonomy.stats");
  const format = useFormatter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        highlight
        icon={Languages}
        label={t("untranslated")}
        value={format.number(summary.untranslated)}
        footnote={t("untranslatedFoot", { total: entries })}
      />
      <KpiTile
        icon={Layers}
        label={t("sectors")}
        value={format.number(summary.sectors)}
        footnote={t("sectorsFoot", { count: summary.sectorsWithoutCategory })}
      />
      <KpiTile
        icon={Shapes}
        label={t("categories")}
        value={format.number(summary.categories)}
        footnote={t("categoriesFoot", { count: specFields })}
      />
      <KpiTile
        icon={Building2}
        label={t("unclassified")}
        value={format.number(summary.companiesWithoutSector)}
        footnote={t("unclassifiedFoot")}
      />
    </div>
  );
}
