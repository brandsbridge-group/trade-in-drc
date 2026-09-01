import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";

const WHY_KEYS = ["credible", "reach", "connections", "visibility", "sectors", "secure"] as const;

/** "Why Use the Trade in DRC Opportunities Board?" panel (design 2). */
export async function OppWhyPanel() {
  const t = await getTranslations("Opportunities.why");
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-display text-sm font-bold text-market-navy">{t("title")}</h2>
      <ul className="mt-3 space-y-2.5">
        {WHY_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-2.5 text-xs text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-market-gold" aria-hidden />
            {t(`items.${key}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}
