import { getTranslations } from "next-intl/server";
import { ShieldCheck, Languages, MessageSquare } from "lucide-react";

const ITEMS = [
  { Icon: ShieldCheck, key: "verified" },
  { Icon: Languages, key: "bilingual" },
  { Icon: MessageSquare, key: "rfq" },
] as const;

export async function WhyStrip({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.why" });

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <div className="rounded-2xl border border-slate-200 bg-card p-5 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        {ITEMS.map(({ Icon, key }) => (
          <div key={key} className="px-5 py-4 first:pl-0 last:pr-0 sm:py-0">
            <Icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-sm font-medium">{t(`items.${key}.title`)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(`items.${key}.body`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
