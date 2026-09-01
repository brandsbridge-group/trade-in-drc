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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Title block */}
        <div className="shrink-0 lg:w-32">
          <h2 className="font-display text-xl font-bold leading-tight text-market-navy">
            {t("title")}
          </h2>
          <span className="mt-1.5 block h-0.5 w-10 bg-market-red" />
        </div>

        {/* Steps + connectors */}
        <div className="flex flex-1 flex-col gap-5 lg:flex-row lg:items-start">
          {STEPS.map((key, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div key={key} className="flex flex-1 items-start gap-3 lg:contents">
                <div className="flex flex-1 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-market-navy text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-market-navy" strokeWidth={1.75} aria-hidden />
                      <span className="text-sm font-bold text-market-navy">{t(`steps.${key}.title`)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{t(`steps.${key}.body`)}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className="mt-4 hidden shrink-0 select-none tracking-widest text-slate-300 lg:inline"
                    aria-hidden
                  >
                    ····▸
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
