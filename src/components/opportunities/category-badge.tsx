"use client";
import { useTranslations } from "next-intl";
import { Gavel, Handshake, TrendingUp, Tag, ShoppingCart, FileText, Users, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityCategory } from "@/lib/opportunities/categories";

const iconByCategory: Record<OpportunityCategory, React.ElementType> = {
  tender: Gavel,
  ppp: Handshake,
  investment_call: TrendingUp,
  offer: Tag,
  demand: ShoppingCart,
  quotation: FileText,
  partner_search: Users,
  project_launch: Rocket,
};

export function CategoryBadge({ category, className }: { category: OpportunityCategory; className?: string }) {
  const t = useTranslations("Opportunities.categories");
  const Icon = iconByCategory[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full bg-muted text-foreground",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {t(category)}
    </span>
  );
}
