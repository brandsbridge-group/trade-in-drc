import { getTranslations } from "next-intl/server";
import { Headset, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

/**
 * "Need help navigating…?" conversion banner (design 4), aligned to the card
 * grid. Routes to the existing /request feature.
 */
export async function GuidanceBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Institutions" });

  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-market-navy/5 text-market-navy">
          <Headset className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-market-navy">{t("bannerTitle")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("bannerSubtitle")}</p>
        </div>
      </div>
      <Link
        href="/request"
        className="inline-flex shrink-0 items-center gap-2 rounded-md bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-market-navy-deep"
      >
        {t("requestGuidance")}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
