import { getTranslations } from "next-intl/server";
import { ClipboardList, Search, Users, Handshake } from "lucide-react";
import { STEPS } from "./services-config";

const STEP_ICONS = [ClipboardList, Search, Users, Handshake];

/**
 * "How It Works" band (design Our Services): title block on the left, then the
 * 4 steps flowing horizontally with dashed arrow connectors between them.
 */
export async function HowItWorks() {
  const t = await getTranslations("Services.how");

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.7)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold leading-tight text-market-navy">{t("title")}</h2>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Flow
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {STEPS.map((key, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <div
              key={key}
              className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-white/90 p-4 shadow-[0_12px_20px_-18px_rgba(15,23,42,0.75)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-market-navy text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-market-navy" strokeWidth={1.75} aria-hidden />
                  <span className="text-sm font-bold text-market-navy">{t(`steps.${key}.title`)}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{t(`steps.${key}.body`)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
