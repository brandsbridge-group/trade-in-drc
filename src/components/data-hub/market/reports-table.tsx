import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { FileText, Download, ArrowRight } from "lucide-react";

export interface ReportRow {
  slug: string;
  title: string;
  category: string;
  coverageKey: "national" | "regional" | "provinces";
  typeKey: "report" | "dataset";
  publishedLabel: string;
  attachmentUrl: string | null;
}

const REPORTS_KIND = "market_report";

/** Latest Reports & Datasets table with per-row View / Download actions. */
export function ReportsTable({ rows }: { rows: ReportRow[] }) {
  const t = useTranslations("MarketIntel.reports");

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-market-navy">
          {t("title")}
        </h2>
        <Link
          href={`/data-hub/reports/${REPORTS_KIND}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-market-navy transition-colors duration-150 hover:text-market-red"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[0.7rem] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3 font-semibold">{t("col.report")}</th>
              <th className="py-2 pr-3 font-semibold">{t("col.category")}</th>
              <th className="py-2 pr-3 font-semibold">{t("col.coverage")}</th>
              <th className="py-2 pr-3 font-semibold">{t("col.published")}</th>
              <th className="py-2 pr-3 font-semibold">{t("col.type")}</th>
              <th className="py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  {t("empty")}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.slug} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-market-navy" />
                    <span className="font-medium text-slate-800">{row.title}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.category}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {t(`coverage.${row.coverageKey}`)}
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.publishedLabel}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {t(`type.${row.typeKey}`)}
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/data-hub/reports/${REPORTS_KIND}/${row.slug}`}
                      className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:border-market-navy hover:text-market-navy"
                    >
                      {t("viewReport")}
                    </Link>
                    <Link
                      href={
                        row.attachmentUrl
                          ? (row.attachmentUrl as string)
                          : `/data-hub/reports/${REPORTS_KIND}/${row.slug}`
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-market-red px-3 py-1.5 text-xs font-semibold text-market-red transition-colors duration-150 hover:bg-market-red hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("downloadSummary")}
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
