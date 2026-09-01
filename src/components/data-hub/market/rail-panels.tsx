import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ShieldCheck,
  Layers,
  MapPin,
  Users,
  LineChart,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const WHY_ITEMS: { key: string; icon: LucideIcon }[] = [
  { key: "verified", icon: ShieldCheck },
  { key: "depth", icon: Layers },
  { key: "province", icon: MapPin },
  { key: "discovery", icon: Users },
  { key: "investor", icon: LineChart },
  { key: "growth", icon: BarChart3 },
];

/** "Why Use the Data Hub?" — six icon/checkmark items. */
export function WhyPanel() {
  const t = useTranslations("MarketIntel.why");
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-display text-base font-bold text-market-navy">
        {t("title")}
      </h2>
      <ul className="space-y-3">
        {WHY_ITEMS.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-market-navy text-white">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm text-slate-600">{t(`items.${key}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** For Investors (navy) + For Businesses (red) promo cards. */
export function PromoCards() {
  const t = useTranslations("MarketIntel.promo");
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PromoCard
        title={t("investors.title")}
        body={t("investors.body")}
        cta={t("investors.cta")}
        href="/opportunities"
        variant="navy"
      />
      <PromoCard
        title={t("business.title")}
        body={t("business.body")}
        cta={t("business.cta")}
        href="/companies"
        variant="red"
      />
    </div>
  );
}

function PromoCard({
  title,
  body,
  cta,
  href,
  variant,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  variant: "navy" | "red";
}) {
  const bg = variant === "navy" ? "bg-market-navy" : "bg-market-red";
  const btn =
    variant === "navy"
      ? "bg-white text-market-navy hover:bg-white/90"
      : "bg-market-navy text-white hover:bg-market-navy/90";
  return (
    <div className={`flex flex-col rounded-lg p-5 text-white ${bg}`}>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mt-1.5 flex-1 text-xs text-white/85">{body}</p>
      <Link
        href={href}
        className={`mt-4 inline-flex items-center gap-1 self-start rounded-md px-4 py-2 text-xs font-semibold transition-colors duration-150 ${btn}`}
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
