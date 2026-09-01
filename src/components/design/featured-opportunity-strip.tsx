import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { OpportunityCardDesign } from "./opportunity-card-design";
import type { Opportunity } from "@/lib/opportunities/types";

export async function FeaturedOpportunityStrip({
  items,
  locale,
}: {
  items: Opportunity[];
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "Design" });
  return (
    <div className="grid gap-2.5 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {items.slice(0, 5).map((o) => (
        <OpportunityCardDesign key={o.id} item={o} locale={locale} />
      ))}
      <Link
        href="/dashboard/opportunities/new"
        className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 flex flex-col items-center justify-center text-sm text-primary hover:bg-slate-50 transition"
      >
        <Plus className="w-5 h-5 mb-1" />
        {t("addRfq")}
      </Link>
    </div>
  );
}
