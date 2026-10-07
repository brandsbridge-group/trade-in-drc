import { getTranslations } from "next-intl/server";
import { UsersRound } from "lucide-react";
import { AUDIENCES } from "./services-config";

/** "Who We Serve" audience panel beside the request form. */
export async function WhoWeServe() {
  const t = await getTranslations("Services.audience");

  return (
    <aside className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.7)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-market-navy">
            <UsersRound className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="font-display text-lg font-bold text-market-navy">{t("title")}</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Focus
        </span>
      </div>

      <div className="grid gap-3">
        {AUDIENCES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white/80 p-3 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.68)]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-market-navy text-white">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <div className="text-sm font-bold text-market-navy">{t(`${key}.title`)}</div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t(`${key}.body`)}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
