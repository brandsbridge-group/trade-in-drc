import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";

/** White → navy → gold: the three steps read as one progression. */
const STEPS = [
  {
    key: "register",
    card: "bg-white ring-1 ring-slate-200/80 text-[var(--color-landing-navy)]",
    body: "text-slate-500",
    chip: "bg-slate-100 text-slate-500",
    number: "text-slate-100",
  },
  {
    key: "verify",
    card: "bg-market-navy text-white",
    body: "text-white/65",
    chip: "bg-white/10 text-white/70",
    number: "text-white/[0.06]",
  },
  {
    key: "connect",
    card: "bg-market-or text-market-navy",
    body: "text-market-navy/75",
    chip: "bg-market-navy/10 text-market-navy/70",
    number: "text-market-navy/10",
  },
] as const;

/**
 * Homepage section 9 — "Start trading in three steps": three numbered cards
 * (register, get verified, connect) and the two ways in.
 */
export async function HomeSteps({ locale }: { locale: string }) {
  const [tHow, t] = await Promise.all([
    getTranslations({ locale, namespace: "Landing.howItWorks" }),
    getTranslations({ locale, namespace: "HomeSteps" }),
  ]);

  return (
    <HomeSection id="how-it-works">
      <MotionEnter>
        <HomeSectionHeader eyebrow={tHow("eyebrow")} title={tHow("title")} />
      </MotionEnter>

      <ol className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-3">
        {STEPS.map(({ key, card, body, chip, number }, i) => (
          <li key={key}>
            <MotionEnter className="h-full">
              <div className={cn("relative flex h-full min-h-[11rem] flex-col overflow-hidden rounded-[1.25rem] p-5 sm:p-6", card)}>
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-3 right-3 select-none font-display text-[5.5rem] font-bold leading-none tracking-tighter",
                    number,
                  )}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "relative w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                    chip,
                  )}
                >
                  {t("step")} {i + 1}
                </span>
                <h3 className="relative mt-4 text-base font-bold">{tHow(`steps.${key}.title`)}</h3>
                <p className={cn("relative mt-1.5 max-w-[16rem] text-[13px] leading-relaxed", body)}>
                  {tHow(`steps.${key}.desc`)}
                </p>
              </div>
            </MotionEnter>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href="/register-company"
          className="group inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-[#13244a]"
        >
          {t("cta")}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <Link
          href="/companies"
          className="text-[13px] font-semibold text-market-or-dark underline-offset-4 transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)] hover:underline"
        >
          {t("secondary")}
        </Link>
      </div>
    </HomeSection>
  );
}
