import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runGlobalSearch } from "@/lib/search/api";
import { groupResults, TYPE_ORDER } from "@/lib/search/rank";
import { recordSearchAppearances } from "@/lib/search/analytics";
import type { SearchEntityType } from "@/lib/search/types";
import { ResultItem } from "@/components/search/result-item";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const filterType = sp.type as SearchEntityType | undefined;
  const t = await getTranslations({ locale, namespace: "Search" });
  const supabase = await createServerSupabaseClient();
  const rows = q ? await runGlobalSearch(supabase, q, locale as "en" | "fr", 20) : [];
  const grouped = groupResults(rows);

  // Feed Req-11 business analytics: a direct visit to /search?q= records
  // search-result appearances + the query term against each surfaced profile.
  if (q && rows.length > 0) {
    await recordSearchAppearances(
      q,
      rows.map((r) => ({ entityType: r.entity_type, entityId: r.entity_id }))
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">{t("page.title")}</h1>
      {q && (
        <p className="text-sm text-muted-foreground mb-6">
          {t("page.queryLabel")}: <span className="font-medium">{q}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-6">
        <a
          href={`/${locale}/search?q=${encodeURIComponent(q)}`}
          className={`px-3 py-1 rounded-full text-xs border ${!filterType ? "bg-primary text-primary-foreground" : "bg-card"}`}
        >
          {t("page.all")}
        </a>
        {TYPE_ORDER.map(tp => (
          <a
            key={tp}
            href={`/${locale}/search?q=${encodeURIComponent(q)}&type=${tp}`}
            className={`px-3 py-1 rounded-full text-xs border ${filterType === tp ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {t(`groups.${tp}`)}
          </a>
        ))}
      </div>
      {q && rows.length === 0 && <p className="text-muted-foreground">{t("noResults")}</p>}
      {TYPE_ORDER.filter(tp => !filterType || tp === filterType).map((tp) => {
        const list = grouped[tp];
        if (!list.length) return null;
        return (
          <section key={tp} className="mb-6">
            <h2 className="text-sm font-semibold mb-2">{t(`groups.${tp}`)}</h2>
            <div className="space-y-1">
              {list.map((r) => <ResultItem key={`${tp}:${r.entity_id}`} item={r} />)}
            </div>
          </section>
        );
      })}
    </main>
  );
}
