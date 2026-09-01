import { getTranslations } from "next-intl/server";
import { SERVICES } from "./services-config";

/**
 * The 7 service cards (design Our Services): top row = 4 vertical cards
 * (centered icon), bottom row = 3 wider horizontal cards (icon left). Both
 * rows are equal-height via grid stretch.
 */
export async function ServiceCards() {
  const t = await getTranslations("Services.items");
  const top = SERVICES.slice(0, 4);
  const bottom = SERVICES.slice(4);

  return (
    <section id="services" className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-6 md:px-6">
      {/* Top row — 4 vertical cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {top.map(({ key, icon: Icon }, i) => (
          <div
            key={key}
            className="flex h-full flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-shadow duration-150 hover:shadow-md"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-market-navy">
              <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-sm font-bold text-market-navy">
              {i + 1}. {t(`${key}.title`)}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{t(`${key}.body`)}</p>
          </div>
        ))}
      </div>

      {/* Bottom row — 3 wider horizontal cards (icon left) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bottom.map(({ key, icon: Icon }, i) => (
          <div
            key={key}
            className="flex h-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-150 hover:shadow-md"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-market-navy">
              <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-sm font-bold text-market-navy">
                {i + 5}. {t(`${key}.title`)}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{t(`${key}.body`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
