import { getTranslations } from "next-intl/server";
import { ShieldCheck, BadgeCheck, Award } from "lucide-react";

/**
 * "Understanding Our Verification Badges" card (customer design 7). White
 * rounded card that overlaps the bottom of the hero (negative margin from the
 * parent). Three hairline-divided columns explaining the Registered / Verified /
 * Premium tiers with a colored icon and a tinted pill each.
 */

interface BadgeColumn {
  icon: React.ReactNode;
  title: string;
  desc: string;
  pill: string;
  pillClass: string;
}

export async function BadgeExplainer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "VerifiedDirectory" });

  const columns: BadgeColumn[] = [
    {
      icon: <ShieldCheck className="h-9 w-9 text-blue-600" aria-hidden />,
      title: t("badgeRegisteredTitle"),
      desc: t("badgeRegisteredDesc"),
      pill: t("badgeRegisteredPill"),
      pillClass: "bg-slate-100 text-slate-600",
    },
    {
      icon: <BadgeCheck className="h-9 w-9 text-emerald-600" aria-hidden />,
      title: t("badgeVerifiedTitle"),
      desc: t("badgeVerifiedDesc"),
      pill: t("badgeVerifiedPill"),
      pillClass: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: <Award className="h-9 w-9 text-market-gold" aria-hidden />,
      title: t("badgePremiumTitle"),
      desc: t("badgePremiumDesc"),
      pill: t("badgePremiumPill"),
      pillClass: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="relative z-10 -mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-lg md:-mt-10 md:p-8">
      <h2 className="text-center font-display text-lg font-bold tracking-tight text-market-navy">
        {t("badgesTitle")}
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0">
        {columns.map((col, i) => (
          <div
            key={i}
            className={`flex flex-col items-center px-6 text-center ${
              i > 0 ? "md:border-l md:border-slate-200" : ""
            }`}
          >
            {col.icon}
            <h3 className="mt-3 font-semibold text-market-navy">{col.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{col.desc}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${col.pillClass}`}
            >
              {col.pill}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
