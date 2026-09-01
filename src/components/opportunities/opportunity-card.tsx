import { Link } from "@/i18n/routing";
import type { Opportunity } from "@/lib/opportunities/types";
import { CategoryBadge } from "./category-badge";

export function OpportunityCard({ item, locale }: { item: Opportunity; locale: string }) {
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const summary = locale === "fr" ? item.summary_fr : item.summary_en;
  const deadline = item.deadline_at ? new Date(item.deadline_at).toLocaleDateString(locale) : null;
  return (
    <Link
      href={`/opportunities/${item.category}/${item.slug}`}
      className="block border rounded-md p-4 bg-card hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-medium">{title}</h3>
        <CategoryBadge category={item.category} />
      </div>
      <p className="text-sm text-muted-foreground mb-2">{summary}</p>
      {deadline && <p className="text-xs text-muted-foreground">{deadline}</p>}
    </Link>
  );
}
