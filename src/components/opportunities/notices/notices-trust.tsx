import { getTranslations } from "next-intl/server";
import { CalendarCheck, Link2, MapPinned } from "lucide-react";

import { DRC_PROVINCES } from "@/config/provinces";

const ITEMS = [
  { key: "source", Icon: Link2 },
  { key: "weekly", Icon: CalendarCheck },
  { key: "provinces", Icon: MapPinned },
] as const;

/**
 * Three editorial promises, as one white card pulled up over the bottom of the
 * navy hero (the same treatment as the marketplace trust strip).
 */
export async function NoticesTrust() {
  const t = await getTranslations("Notices.trust");

  return (
    <div className="relative z-10 mx-auto -mt-12 w-full max-w-7xl px-4 md:px-6">
      <ul className="grid divide-y divide-slate-100 rounded-2xl bg-white shadow-xl shadow-slate-900/[0.08] ring-1 ring-slate-200/70 md:grid-cols-3 md:divide-x md:divide-y-0">
        {ITEMS.map(({ key, Icon }) => (
          <li key={key} className="flex items-start gap-3.5 p-5">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-market-or/10 text-market-or-dark">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold text-[var(--color-landing-navy)]">
                {t(`${key}.title`, { count: DRC_PROVINCES.length })}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{t(`${key}.body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
