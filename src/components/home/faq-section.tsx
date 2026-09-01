import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export async function FaqSection() {
  const t = await getTranslations("Home.faq");
  return (
    <section className="max-w-3xl mx-auto px-4 py-4">
      <div className="rounded-2xl border border-slate-200 bg-card p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-primary mb-2">{t("tag")}</p>
        <h2 className="text-2xl font-semibold mb-2">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t("subtitle")}</p>
        <div className="grid sm:grid-cols-2 gap-x-6 text-left">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="border-b border-slate-200 py-3 group last:border-b-0">
              <summary className="text-sm font-medium cursor-pointer list-none flex items-center justify-between gap-2">
                <span>{t(`items.${key}.q`)}</span>
                <span aria-hidden className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t(`items.${key}.a`)}</p>
            </details>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/faq" className="inline-block text-xs bg-foreground text-background px-4 py-2 rounded-full">
            {t("helpCenter")}
          </Link>
        </div>
      </div>
    </section>
  );
}
