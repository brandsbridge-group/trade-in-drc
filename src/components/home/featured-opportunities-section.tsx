import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FeaturedOpportunityStrip } from "@/components/design";
import type { Opportunity } from "@/lib/opportunities/types";
import { MotionEnter } from "@/components/home/motion-enter";

export async function FeaturedOpportunitiesSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.featured" });
  const supabase = await createServerSupabaseClient();
  let items: Opportunity[] = [];
  try {
    const { data } = await supabase
      .from("opportunities")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5);
    items = ((data ?? []) as unknown as Opportunity[]);
  } catch { /* migrations may not be applied yet — silent */ }
  return (
    <MotionEnter>
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-card p-5">
          <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>
          <FeaturedOpportunityStrip items={items} locale={locale} />
        </div>
      </section>
    </MotionEnter>
  );
}
