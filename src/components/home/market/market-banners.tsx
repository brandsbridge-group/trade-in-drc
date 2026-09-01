import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, Handshake, Store } from "lucide-react";

/** For Buyers (navy) / For Sellers (cream) dual banner strip — design 1. */
export async function MarketBanners() {
  const t = await getTranslations("MarketHome.banners");
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex items-start gap-4 rounded-lg bg-market-navy p-5 text-white">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-market-gold">
          <Handshake className="h-6 w-6 text-market-gold" aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-base font-bold">{t("buyersTitle")}</h3>
          <p className="mt-1 text-xs text-white/80">{t("buyersBody")}</p>
          <Link
            href="/products"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-market-gold px-3.5 py-2 text-xs font-bold text-market-navy transition-colors duration-150 hover:bg-yellow-400"
          >
            {t("buyersCta")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="flex items-start gap-4 rounded-lg border border-amber-200 bg-market-cream p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-market-red bg-white">
          <Store className="h-6 w-6 text-market-red" aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-market-navy">{t("sellersTitle")}</h3>
          <p className="mt-1 text-xs text-slate-600">{t("sellersBody")}</p>
          <Link
            href="/register-company"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-market-red px-3.5 py-2 text-xs font-bold text-white transition-colors duration-150 hover:bg-market-red-dark"
          >
            {t("sellersCta")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
