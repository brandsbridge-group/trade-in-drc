import { getTranslations } from "next-intl/server";
import { ShieldCheck, TrendingUp, Target, Lock, BarChart3, Globe } from "lucide-react";

/** Six reasons, two columns, on the navy card (left of the bottom band). */
const REASONS = [
  { key: "verified", Icon: ShieldCheck },
  { key: "growth", Icon: TrendingUp },
  { key: "targeted", Icon: Target },
  { key: "secure", Icon: Lock },
  { key: "intelligence", Icon: BarChart3 },
  { key: "reach", Icon: Globe },
] as const;

/** "Why Use Trade in DRC Marketplace?" — navy card from the customer design. */
export async function WhyUseCard() {
  const t = await getTranslations("MarketplacePage.why");
  return (
    <section className="h-full rounded-xl bg-[var(--color-landing-navy)] p-5 text-white">
      <h2 className="font-display text-lg font-bold">{t("heading")}</h2>
      <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {REASONS.map(({ key, Icon }) => (
          <div key={key} className="flex gap-2.5">
            <Icon className="mt-0.5 h-5 w-5 flex-none text-white/80" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold leading-tight">{t(`${key}.title`)}</h3>
              <p className="mt-1 text-[12px] leading-snug text-white/70">{t(`${key}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
