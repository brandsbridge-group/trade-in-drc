import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";
import { DIRECTION_IMAGES, type Origin } from "@/lib/marketplace/offers";
import { countOffersByOrigin } from "@/lib/marketplace/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Checks run before a company is published (see VerificationApproach). */
const VERIFICATION_CHECKS = 4;

async function loadStart() {
  const supabase = await createServerSupabaseClient();
  const [companies, provinceRows, offers] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "verified"),
    supabase.from("companies").select("province").eq("status", "verified").not("province", "is", null),
    countOffersByOrigin(supabase),
  ]);
  return {
    companies: companies.count ?? 0,
    provinces: new Set((provinceRows.data ?? []).map((r) => r.province).filter(Boolean)).size,
    offers,
  };
}

/**
 * Homepage sections 1 and 2, right under the hero: a commitments band (one
 * promise backed by the verification process, two live counts) and the three
 * entry paths — Buy (with the Import / Export split), Sell, Invest.
 */
export async function HomeStart({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "HomeStart" });
  const data = await loadStart();

  return (
    <>
      <HomeSection className="pb-0 sm:pb-0">
        <Commitments t={t} companies={data.companies} provinces={data.provinces} />
      </HomeSection>
      <HomeSection>
        <Paths t={t} offers={data.offers} />
      </HomeSection>
    </>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"HomeStart">>>;

// ── 1. Commitments band ─────────────────────────────────────────────────────

function Commitments({ t, companies, provinces }: { t: T; companies: number; provinces: number }) {
  const items: {
    key: "checks" | "companies" | "provinces";
    Icon: LucideIcon;
    value: number;
    highlight?: boolean;
  }[] = [
    { key: "checks", Icon: ShieldCheck, value: VERIFICATION_CHECKS },
    { key: "companies", Icon: Building2, value: companies, highlight: true },
    { key: "provinces", Icon: MapPin, value: provinces },
  ];

  return (
    <MotionEnter>
      <div
        aria-label={t("commitments.label")}
        role="group"
        className="rounded-[1.5rem] border border-slate-200/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-28px_rgba(15,23,42,0.3)]"
      >
        <ul className="grid gap-1.5 md:grid-cols-3">
          {items.map(({ key, Icon, value, highlight }) => (
            <li
              key={key}
              className={cn(
                "flex gap-3.5 rounded-[1.15rem] p-4 sm:p-5",
                highlight && "bg-gradient-to-br from-market-or/[0.12] via-market-or/[0.05] to-transparent ring-1 ring-inset ring-market-or/15",
              )}
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-market-or/10 text-market-or-dark ring-1 ring-inset ring-market-or/25">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-display text-[1.75rem] font-bold leading-none tabular-nums tracking-tight text-[var(--color-landing-navy)]">
                    {value}
                  </span>
                  <span className="text-[15px] font-semibold text-market-or-dark">
                    {t(`commitments.${key}.unit`, { count: value })}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--color-landing-navy)]">
                    {t(`commitments.${key}.label`, { count: value })}
                  </span>
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{t(`commitments.${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MotionEnter>
  );
}

// ── 2. Entry paths ──────────────────────────────────────────────────────────

const POINTS = ["p1", "p2", "p3"] as const;

function Paths({ t, offers }: { t: T; offers: Record<Origin, number> }) {
  return (
    <>
      <MotionEnter>
        <HomeSectionHeader
          eyebrow={t("paths.eyebrow")}
          title={t("paths.title")}
          lead={t("paths.lead")}
          action={
            <Link
              href="/services"
              className="group inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-4 shadow-sm transition-colors duration-150 ease-out hover:border-slate-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-landing-navy)] text-xs font-bold text-market-or">
                ?
              </span>
              <span className="text-left leading-tight">
                <span className="block text-[11px] text-slate-500">{t("paths.advisorQ")}</span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-landing-navy)]">
                  {t("paths.advisorCta")}
                  <ArrowRight className="h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            </Link>
          }
        />
      </MotionEnter>

      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Buy — with the Import / Export split */}
        <PathCard index={1} Icon={ShoppingCart} t={t} path="buy" href="/market">
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["import", "export"] as const).map((origin) => (
              <Link
                key={origin}
                href={`/products?origin=${origin}`}
                className="group/tile relative block h-24 overflow-hidden rounded-xl bg-slate-200"
              >
                <Image
                  src={DIRECTION_IMAGES[origin]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 160px, 45vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover/tile:scale-[1.04]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/5" aria-hidden />
                {offers[origin] > 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-md">
                    {t("paths.offers", { count: offers[origin] })}
                  </span>
                )}
                <span className="absolute inset-x-2.5 bottom-2 flex items-end justify-between gap-1 text-xs font-semibold leading-tight text-white">
                  <span className="line-clamp-2">{t(`paths.buy.${origin}`)}</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 flex-none transition-transform duration-150 ease-out group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </PathCard>

        {/* Sell — the featured path */}
        <PathCard index={2} Icon={TrendingUp} t={t} path="sell" href="/register-company" featured />

        {/* Invest */}
        <PathCard index={3} Icon={BarChart3} t={t} path="invest" href="/data-hub">
          <Link
            href="/opportunities?tab=investment"
            className="group mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-market-or-dark transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)]"
          >
            {t("paths.invest.secondary")}
            <ArrowRight className="h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </PathCard>
      </ul>
    </>
  );
}

function PathCard({
  index,
  Icon,
  t,
  path,
  href,
  featured = false,
  children,
}: {
  index: number;
  Icon: LucideIcon;
  t: T;
  path: "buy" | "sell" | "invest";
  href: string;
  featured?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li>
      <MotionEnter className="h-full">
        <article
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-[1.5rem] p-5 sm:p-6",
            featured
              ? "bg-gradient-to-br from-[#16305a] via-market-navy to-market-navy text-white shadow-[0_24px_50px_-28px_rgba(2,6,23,0.7)] ring-1 ring-inset ring-market-or/40"
              : "border border-slate-200/80 bg-white shadow-sm",
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute -right-1 -top-3 select-none font-display text-[5.5rem] font-bold leading-none tracking-tighter",
              featured ? "text-white/[0.05]" : "text-slate-100",
            )}
            aria-hidden
          >
            {String(index).padStart(2, "0")}
          </span>

          <div className="relative flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                featured
                  ? "bg-market-or text-market-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                  : "bg-market-or/10 text-market-or-dark ring-1 ring-inset ring-market-or/25",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            {featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-market-or ring-1 ring-inset ring-market-or/40">
                <span className="h-1.5 w-1.5 rounded-full bg-market-or" aria-hidden />
                {t("paths.sell.badge")}
              </span>
            )}
          </div>

          <h3 className={cn("relative mt-5 text-xl font-bold", featured ? "text-white" : "text-[var(--color-landing-navy)]")}>
            {t(`paths.${path}.title`)}
          </h3>
          <p className={cn("relative mt-1.5 text-sm leading-relaxed", featured ? "text-white/65" : "text-slate-500")}>
            {t(`paths.${path}.body`)}
          </p>

          <hr className={cn("relative my-5", featured ? "border-white/10" : "border-slate-200/80")} />

          <ul className="relative space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className={cn("flex items-start gap-2.5 text-[13px]", featured ? "text-white/85" : "text-slate-700")}>
                <span
                  className={cn(
                    "mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full",
                    featured ? "bg-market-or/15 text-market-or" : "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
                  )}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                </span>
                {t(`paths.${path}.${p}`)}
              </li>
            ))}
          </ul>

          <div className="relative">{children}</div>

          <div className="relative mt-auto pt-6">
            <Link
              href={href}
              className={cn(
                "group flex items-center justify-between rounded-full py-1 pl-4 pr-1 text-[13px] font-semibold transition-colors duration-150 ease-out",
                featured
                  ? "bg-market-or text-market-navy hover:bg-market-or-light"
                  : "bg-slate-100 text-[var(--color-landing-navy)] hover:bg-slate-200/80",
              )}
            >
              {t(`paths.${path}.cta`)}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-market-navy text-white">
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </div>
        </article>
      </MotionEnter>
    </li>
  );
}
