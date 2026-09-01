import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function safeCount(
  p: PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  try {
    const r = await p;
    return r.count ?? 0;
  } catch {
    return 0;
  }
}

export async function StatsStrip({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.stats" });
  const supabase = await createServerSupabaseClient();

  const [companies, sectors, products, opportunities] = await Promise.all([
    safeCount(
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified")
    ),
    safeCount(
      supabase
        .from("sectors")
        .select("*", { count: "exact", head: true })
    ),
    safeCount(
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
    ),
    safeCount(
      supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
    ),
  ]);

  const stats = [
    { label: t("companies"), value: companies },
    { label: t("sectors"), value: sectors },
    { label: t("products"), value: products },
    { label: t("opportunities"), value: opportunities },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="rounded-2xl border border-slate-200 bg-card px-6 py-5 grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 text-center">
        {stats.map((s, i) => (
          <div key={i} className="px-4 first:pl-0 last:pr-0">
            <p className="text-2xl font-semibold text-primary tabular-nums">
              {s.value}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
