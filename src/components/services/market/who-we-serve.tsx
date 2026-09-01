import { getTranslations } from "next-intl/server";
import { UsersRound } from "lucide-react";
import { AUDIENCES } from "./services-config";

/** "Who We Serve" audience panel beside the request form. */
export async function WhoWeServe() {
  const t = await getTranslations("Services.audience");
  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <UsersRound className="h-6 w-6 text-market-navy" strokeWidth={1.75} aria-hidden />
        <h2 className="font-display text-lg font-bold text-market-navy">{t("title")}</h2>
      </div>
      <div className="grid gap-4">
        {AUDIENCES.map(({ key, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3">
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
