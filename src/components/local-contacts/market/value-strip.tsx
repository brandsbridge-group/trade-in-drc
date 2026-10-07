import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import { Search, ShieldCheck, Users } from "lucide-react";

interface ValueItem {
  key: "discover" | "verify" | "connect";
  icon: LucideIcon;
}

const VALUE_ITEMS: readonly ValueItem[] = [
  { key: "discover", icon: Search },
  { key: "verify", icon: ShieldCheck },
  { key: "connect", icon: Users },
] as const;

/** Discover / Verify / Connect trust strip on a light-grey band (customer design 3). */
export async function ValueStrip() {
  const t = await getTranslations("LocalContacts.value");

  return (
    <section className="bg-transparent py-8 md:py-6">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-5 px-4 md:grid-cols-3 md:px-6">
        {VALUE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-start gap-4 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_20px_40px_-38px_rgba(15,23,42,0.7)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-market-navy/5 text-market-navy">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-market-navy">
                  {t(`${item.key}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {t(`${item.key}.desc`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
