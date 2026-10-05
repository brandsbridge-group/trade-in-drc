"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Building2, ClipboardCheck, Crown, ShieldCheck } from "lucide-react";
import { KpiTile } from "@/components/dashboard/overview/kpi-tile";
import type { CompanySummary } from "@/lib/console/companies";

/**
 * Indicators above the company list: the files waiting on staff first (the
 * highlighted tile), then the size and health of the directory. Counted with
 * the same rules as the list's quick views.
 */
export function CompanyKpis({ summary }: { summary: CompanySummary }) {
  const t = useTranslations("Admin.companies.list.stats");
  const format = useFormatter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile highlight icon={ClipboardCheck} label={t("toReview")} value={format.number(summary.toReview)} footnote={t("toReviewFoot")} />
      <KpiTile icon={Building2} label={t("total")} value={format.number(summary.total)} footnote={t("totalFoot", { drc: summary.drc, intl: summary.intl })} />
      <KpiTile icon={ShieldCheck} label={t("verified")} value={format.number(summary.verified)} footnote={t("verifiedFoot", { rate: summary.verifiedRate })} />
      <KpiTile icon={Crown} label={t("premium")} value={format.number(summary.premium)} footnote={t("premiumFoot")} />
    </div>
  );
}
