import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSeriesWithPoints } from "@/lib/data-hub/queries";
import { PriceChart } from "@/components/data-hub/price-chart";
import { PageHeader } from "@/components/design";
import { Sidecar } from "@/components/detail/sidecar";

export default async function PriceSeriesDetailPage({
  params,
}: {
  params: Promise<{ locale: string; seriesId: string }>;
}) {
  const { locale, seriesId } = await params;
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const supabase = await createServerSupabaseClient();
  const { series, points } = await getSeriesWithPoints(supabase, seriesId);
  if (!series) notFound();
  const name = locale === "fr" ? series.commodity_fr : series.commodity_en;
  const latest = points.length ? points[points.length - 1] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PageHeader title={name} subtitle={`${series.currency}/${series.unit}`} />
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold mb-2">{t("prices.chartTitle")}</h2>
          <PriceChart data={points} unit={series.unit} currency={series.currency} />
        </div>
        <Sidecar>
          <p className="text-xs text-muted-foreground">
            {t("prices.pointCount", { count: points.length })}
          </p>
          {latest && (
            <p className="text-sm font-medium">
              {t("prices.latestPrice", {
                value: String(latest.value),
                currency: series.currency,
                unit: series.unit,
              })}
            </p>
          )}
          {series.source && (
            <p className="text-xs text-muted-foreground">
              {t("fields.source")}: {series.source}
            </p>
          )}
        </Sidecar>
      </div>
    </div>
  );
}
