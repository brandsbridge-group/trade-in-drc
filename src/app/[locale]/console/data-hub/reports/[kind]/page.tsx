import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import { isReportKind } from "@/lib/data-hub/kinds";
import type { Report, ReportStatus } from "@/lib/data-hub/types";
import { PageHeader } from "@/components/console/page-header";

function statusClass(status: ReportStatus) {
  if (status === "published") return "text-green-700";
  if (status === "archived") return "text-muted-foreground";
  return "text-amber-700";
}

export default async function ReportListPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string }>;
}) {
  const { locale, kind } = await params;
  if (!isReportKind(kind)) notFound();
  const t = await getTranslations({ locale, namespace: "DataHub.admin.reports" });

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("kind", kind)
    .order("updated_at", { ascending: false });

  const items = (data ?? []) as unknown as Report[];

  return (
    <div className="space-y-4">
      <PageHeader
        title={kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        action={
          <Link
            href={`/console/data-hub/reports/${kind}/new`}
            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            {t("new")}
          </Link>
        }
      />
      <div className="console-table-card">
      <table className="w-full text-sm border-collapse">
        <thead className="text-left">
          <tr>
            <th className="py-2 font-medium">{t("colTitle")}</th>
            <th className="py-2 font-medium">{t("colStatus")}</th>
            <th className="py-2 font-medium">{t("colUpdated")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b hover:bg-muted/30">
              <td className="py-2">
                <Link
                  href={`/console/data-hub/reports/${kind}/${item.id}`}
                  className="underline underline-offset-2 hover:text-primary"
                >
                  {item.title_en}
                </Link>
              </td>
              <td className="py-2">
                <span className={statusClass(item.status)}>{item.status}</span>
              </td>
              <td className="py-2 text-muted-foreground">
                {new Date(item.updated_at).toLocaleDateString(locale)}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-muted-foreground">
                {t("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
