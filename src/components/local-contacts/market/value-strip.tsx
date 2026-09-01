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
    <section className="bg-slate-50 py-8 md:py-6">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-6 px-4 md:grid-cols-3 md:px-6">
        {VALUE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-market-navy/5">
                <Icon className="h-6 w-6 text-market-navy" strokeWidth={1.75} aria-hidden />
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
