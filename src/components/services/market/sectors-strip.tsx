import { getTranslations } from "next-intl/server";
import { SECTOR_CHIPS } from "./services-config";

/** "Strategic Sectors We Cover" — 11 static chips with line icons. */
export async function SectorsStrip() {
  const t = await getTranslations("Services.sectors");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-display text-base font-bold text-market-navy">{t("title")}</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {SECTOR_CHIPS.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors duration-150 hover:border-market-navy/30"
          >
            <Icon className="h-5 w-5 shrink-0 text-market-navy" strokeWidth={1.75} aria-hidden />
            <span className="text-[0.7rem] font-semibold leading-tight text-slate-700">{t(`chips.${key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
