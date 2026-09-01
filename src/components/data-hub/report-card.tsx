import { Link } from "@/i18n/routing";
import type { Report } from "@/lib/data-hub/types";

export function ReportCard({ item, locale }: { item: Report; locale: string }) {
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const summary = locale === "fr" ? item.summary_fr : item.summary_en;
  const date = item.published_at
    ? new Date(item.published_at).toLocaleDateString(locale)
    : null;
  return (
    <Link
      href={`/data-hub/reports/${item.kind}/${item.slug}`}
      className="block border border-slate-200 rounded-2xl p-3 bg-white hover:border-slate-300 transition"
    >
      <h3 className="font-medium mb-1">{title}</h3>
      {summary && <p className="text-sm text-muted-foreground mb-2">{summary}</p>}
      {date && <p className="text-xs text-muted-foreground">{date}</p>}
    </Link>
  );
}
