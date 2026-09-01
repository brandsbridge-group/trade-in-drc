"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Handshake,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  BadgeCheck,
  Lock,
} from "lucide-react";

const WHY_ITEMS = [
  { key: "opportunities", Icon: Users },
  { key: "partners", Icon: Handshake },
  { key: "intelligence", Icon: BarChart3 },
  { key: "grow", Icon: TrendingUp },
] as const;

const SAFE_ITEMS = [
  { key: "secure", Icon: Lock },
  { key: "verified", Icon: BadgeCheck },
  { key: "privacy", Icon: ShieldCheck },
] as const;

/**
 * The two closing bands of the international registration design:
 * "Why Register on Trade in DRC?" and "Your Data is Safe with Us".
 */
export function IntlStrips() {
  const t = useTranslations("RegisterCompany.intl");

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-4 pb-12 md:px-6">
      {/* Why register */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.6fr)]">
          <div>
            <h2 className="font-display text-lg font-bold text-market-navy">
              {t("why.heading")}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-snug text-slate-600">
              {t("why.body")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ITEMS.map(({ key, Icon }) => (
              <div key={key} className="flex gap-2.5">
                <span className="grid size-9 flex-none place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-market-navy">
                    {t(`why.items.${key}.title`)}
                  </h3>
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-600">
                    {t(`why.items.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data safety */}
      <section className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          <div className="flex gap-3">
            <ShieldCheck className="size-6 flex-none text-primary" strokeWidth={1.75} aria-hidden />
            <div>
              <h2 className="font-display text-base font-bold text-market-navy">
                {t("safe.title")}
              </h2>
              <p className="mt-1 text-[12.5px] leading-snug text-slate-600">
                {t("safe.body")}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {SAFE_ITEMS.map(({ key, Icon }) => (
              <div key={key} className="flex items-center gap-2.5">
                <Icon className="size-5 flex-none text-primary" strokeWidth={1.75} aria-hidden />
                <div className="min-w-0">
                  <h3 className="text-[12.5px] font-bold text-market-navy">
                    {t(`safe.items.${key}.title`)}
                  </h3>
                  <p className="text-[11.5px] text-slate-600">
                    {t(`safe.items.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
