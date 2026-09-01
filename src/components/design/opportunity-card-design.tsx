import { Link } from "@/i18n/routing";
import { CategoryBadge } from "@/components/opportunities/category-badge";
import { TagChip } from "./tag-chip";
import { Stat } from "./stat";
import { Eye, Clock } from "lucide-react";
import type { Opportunity } from "@/lib/opportunities/types";

interface Props {
  item: Opportunity;
  locale: string;
  views?: number;
}

export function OpportunityCardDesign({ item, locale, views }: Props) {
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const summary = locale === "fr" ? item.summary_fr : item.summary_en;
  const deadline = item.deadline_at
    ? new Date(item.deadline_at).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return (
    <Link
      href={`/opportunities/${item.category}/${item.slug}`}
      className="block border border-slate-200 rounded-2xl p-3 bg-white hover:border-slate-300 transition"
    >
      <div className="flex flex-col items-start gap-1.5 mb-2">
        <div className="whitespace-nowrap"><CategoryBadge category={item.category} /></div>
        {(views !== undefined || deadline) && (
          <div className="flex items-center gap-3">
            {views !== undefined && <Stat icon={<Eye className="w-3 h-3" />} value={views} />}
            {deadline && <Stat icon={<Clock className="w-3 h-3" />} value={deadline} />}
          </div>
        )}
      </div>
      <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
      {item.region && (
        <div className="mt-2"><TagChip>{item.region}</TagChip></div>
      )}
    </Link>
  );
}
