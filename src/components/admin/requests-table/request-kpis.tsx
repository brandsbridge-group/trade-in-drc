"use client";

import { useFormatter, useTranslations } from "next-intl";
import { CheckCircle2, RefreshCw, Send, Sparkles } from "lucide-react";
import { KpiTile } from "@/components/dashboard/overview/kpi-tile";
import type { RequestView } from "@/lib/requests/views";

/**
 * Indicators above the request list: what needs doing first (the highlighted
 * tile), then the state of the pipeline. Counts follow the table's quick views.
 */
export function RequestKpis({ counts, handledRate }: { counts: Record<RequestView, number>; handledRate: number }) {
  const t = useTranslations("AdminRequests.stats");
  const format = useFormatter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        highlight
        icon={Send}
        label={t("toForward")}
        value={format.number(counts.to_forward)}
        footnote={t("toForwardFoot")}
      />
      <KpiTile
        icon={Sparkles}
        label={t("new")}
        value={format.number(counts.new)}
        footnote={t("newFoot", { total: counts.all })}
      />
      <KpiTile
        icon={RefreshCw}
        label={t("inProgress")}
        value={format.number(counts.in_progress + counts.pending)}
        footnote={t("inProgressFoot", { pending: counts.pending })}
      />
      <KpiTile
        icon={CheckCircle2}
        label={t("done")}
        value={format.number(counts.done)}
        footnote={t("doneFoot", { rate: handledRate })}
      />
    </div>
  );
}
