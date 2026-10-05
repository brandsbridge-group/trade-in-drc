import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Building2, FileCheck2, Landmark, Ship } from "lucide-react";

import { Link } from "@/i18n/routing";

/**
 * "Complete your operation" — the service trades that carry a cross-border
 * sale. Each cell leads to its chain page (/market/<key>, see ChainPage).
 */
const SERVICES = [
  { key: "logistics", href: "/market/logistics", Icon: Ship },
  { key: "finance", href: "/market/finance", Icon: Landmark },
  { key: "compliance", href: "/market/facilitation", Icon: FileCheck2 },
  { key: "institutions", href: "/market/institutions", Icon: Building2 },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Minimal editorial layout: the four trades read as one numbered chain —
 * hairline-ruled columns, no boxes. Hover (§2.1, ≤ 200 ms): the cell tints, a
 * gold rule draws in along its top edge, the icon ring warms, the arrow nudges.
 */
export async function MarketServicesGrid() {
  const t = await getTranslations("MarketLanding.services");

  return (
    <section id="chain" className="scroll-mt-16 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-landing-navy)] md:text-[22px]">
          {t("heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{t("lead")}</p>

        <ul className="mt-6 grid border-b border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ key, href, Icon }, i) => (
            <li
              key={key}
              className="relative border-t border-slate-200 sm:even:border-l lg:border-l lg:first:border-l-0"
            >
              <Link
                href={href}
                className="group relative flex h-full flex-col py-6 transition-colors duration-150 ease-out hover:bg-slate-50/80 focus-visible:bg-slate-50/80 sm:px-5"
              >
                {/* Gold rule drawn in over the top hairline. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 -top-px h-0.5 origin-left scale-x-0 bg-market-or transition-transform duration-200 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
                />

                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-landing-navy)] ring-1 ring-slate-200 transition-[background-color,box-shadow] duration-150 ease-out group-hover:bg-market-or/10 group-hover:ring-market-or/50">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] font-medium tabular-nums text-slate-400">
                    {pad(i + 1)}
                  </span>
                </div>

                <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t(`${key}.eyebrow`)}
                </span>
                <span className="mt-1 font-display text-[17px] font-bold leading-snug text-[var(--color-landing-navy)]">
                  {t(`${key}.title`)}
                </span>
                <span className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-500">
                  {t(`${key}.body`)}
                </span>

                <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-landing-navy)]">
                  {t("cta")}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-market-or transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
