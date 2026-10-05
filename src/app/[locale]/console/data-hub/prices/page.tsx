import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import type { PriceSeries } from "@/lib/data-hub/types";
import { PageHeader } from "@/components/console/page-header";

type SeriesStatus = PriceSeries["status"];

function statusClass(status: SeriesStatus) {
  if (status === "published") return "text-green-700";
  if (status === "archived") return "text-muted-foreground";
  return "text-amber-700";
}

export default async function PricesListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DataHub" });

  const dateFormatter = new Intl.DateTimeFormat(locale);

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("price_series")
    .select("*")
    .order("updated_at", { ascending: false });

  const items = (data ?? []) as unknown as PriceSeries[];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("admin.prices.listTitle")}
        action={
          <Link
            href="/console/data-hub/prices/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            {t("admin.prices.new")}
          </Link>
        }
      />
      <div className="console-table-card">
      <table className="w-full text-sm border-collapse">
        <thead className="text-left">
          <tr>
            <th className="py-2 font-medium">{t("admin.prices.colCommodity")}</th>
            <th className="py-2 font-medium">{t("fields.unit")}</th>
            <th className="py-2 font-medium">{t("fields.currency")}</th>
            <th className="py-2 font-medium">{t("fields.status")}</th>
            <th className="py-2 font-medium">{t("admin.prices.colUpdated")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-muted/30">
              <td className="py-2">
                <Link
                  href={`/console/data-hub/prices/${item.id}`}
                  className="underline underline-offset-2 hover:text-primary"
                >
                  {item.commodity_en}
                </Link>
              </td>
              <td className="py-2 text-muted-foreground">{item.unit}</td>
              <td className="py-2 text-muted-foreground">{item.currency}</td>
              <td className="py-2">
                <span className={statusClass(item.status)}>{t(`status.${item.status}`)}</span>
              </td>
              <td className="py-2 text-muted-foreground">
                {dateFormatter.format(new Date(item.updated_at))}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                {t("admin.prices.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
