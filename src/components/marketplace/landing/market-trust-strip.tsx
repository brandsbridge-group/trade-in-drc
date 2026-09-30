import { getTranslations } from "next-intl/server";
import { MapPinned, ShieldCheck, UserCheck } from "lucide-react";

import { DRC_PROVINCES } from "@/config/provinces";

const PROOFS = [
  { key: "coverage", Icon: MapPinned },
  { key: "verification", Icon: ShieldCheck },
  { key: "response", Icon: UserCheck },
] as const;

/**
 * The three trust proofs, right under the Import / Export cards — one white
 * card: big figure + short label, then the explanation; hairline dividers
 * between columns.
 */
export async function MarketTrustStrip() {
  const t = await getTranslations("MarketLanding.trust");
  const count = DRC_PROVINCES.length;

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <ul className="grid divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white  ring-1 ring-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          {PROOFS.map(({ key, Icon }) => (
            <li key={key} className="flex gap-4 p-5 md:p-6">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-market-or/10 text-market-or ring-1 ring-market-or/25">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--color-landing-navy)] md:text-3xl">
                    {t(`${key}.value`, { count })}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    {t(`${key}.label`)}
                  </span>
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                  {t(`${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
