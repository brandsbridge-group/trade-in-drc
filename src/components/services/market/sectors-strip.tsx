import { getTranslations } from "next-intl/server";
import { SECTOR_CHIPS } from "./services-config";

/** "Strategic Sectors We Cover" — 11 static chips with line icons. */
export async function SectorsStrip() {
  const t = await getTranslations("Services.sectors");

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.7)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-market-navy">{t("title")}</h2>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Coverage
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
        {SECTOR_CHIPS.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex min-h-[68px] items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-3.5 py-3 shadow-[0_12px_18px_-18px_rgba(15,23,42,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:border-market-navy/20"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-market-navy">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-xs font-semibold leading-snug text-slate-700">{t(`chips.${key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
