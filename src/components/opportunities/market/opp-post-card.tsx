import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Megaphone, Plus } from "lucide-react";

/** Navy "Post a Business Opportunity" promo card (design 2). */
export async function OppPostCard() {
  const t = await getTranslations("Opportunities.post");
  return (
    <div className="rounded-lg bg-market-navy p-5 text-white shadow-sm">
      <div className="flex items-start gap-3">
        <Megaphone className="h-7 w-7 shrink-0 text-market-gold" strokeWidth={1.75} aria-hidden />
        <div>
          <h2 className="font-display text-base font-bold">{t("title")}</h2>
          <p className="mt-1 text-xs leading-snug text-white/80">{t("body")}</p>
        </div>
      </div>
      <Link
        href="/dashboard/opportunities/new"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-market-red py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-market-red-dark"
      >
        <Plus className="h-4 w-4" aria-hidden /> {t("cta")}
      </Link>
    </div>
  );
}
