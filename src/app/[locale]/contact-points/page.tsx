import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { HeaderSearch } from "@/components/contact-points/market/header-search";
import { CategorySidebar } from "@/components/contact-points/market/category-sidebar";
import { InstitutionCard } from "@/components/contact-points/market/institution-card";
import { GuidanceBanner } from "@/components/contact-points/market/guidance-banner";
import {
  CATEGORY_ORDER,
  type InstitutionCategory,
} from "@/components/contact-points/market/categories";

/**
 * The `institutions` table is not yet in generated Supabase types, so we define
 * the row shape locally and cast the query result (do NOT edit types.ts).
 */
interface Institution {
  id: string;
  acronym: string;
  name_en: string;
  name_fr: string;
  category: InstitutionCategory;
  description_en: string;
  description_fr: string;
  city: string | null;
  province: string | null;
  website: string | null;
}

/**
 * Minimal self-returning, awaitable query-builder shim for the untyped
 * `institutions` table. Lets us chain filters without pulling `institutions`
 * into the generated Supabase types.
 */
interface UntypedQuery {
  select(columns: string): UntypedQuery;
  order(column: string): UntypedQuery;
  eq(column: string, value: string): UntypedQuery;
  or(filter: string): UntypedQuery;
  then<TResult>(
    onfulfilled: (result: { data: unknown }) => TResult
  ): Promise<TResult>;
}

export default async function ContactPointsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "Institutions" });

  const query = sp.q?.trim() ?? "";
  const activeCategory = sp.category ?? "";

  const supabase = await createServerSupabaseClient();
  // `institutions` isn't in the generated types; cast the CLIENT (not a
  // detached `from`) so the `.from()` call stays bound to `this` (a bare
  // `supabase.from` reference loses its binding → "reading 'rest'" crash).
  const db = supabase as unknown as { from: (table: string) => UntypedQuery };
  let dbQuery = db.from("institutions")
    .select(
      "id, acronym, name_en, name_fr, category, description_en, description_fr, city, province, website"
    )
    .order("acronym");

  if (activeCategory) {
    dbQuery = dbQuery.eq("category", activeCategory);
  }
  if (query) {
    const like = `%${query}%`;
    dbQuery = dbQuery.or(
      `acronym.ilike.${like},name_en.ilike.${like},name_fr.ilike.${like},description_en.ilike.${like}`
    );
  }

  const { data } = await dbQuery;
  const institutions = (data ?? []) as unknown as Institution[];

  const categoryLabels: Record<string, string> = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, t(`category.${c}`)])
  );

  return (
    <div className="min-h-screen bg-white">
      <BreadcrumbBar
        items={[
          { label: t("breadcrumbHome"), href: "/" },
          { label: t("breadcrumbDirectory"), href: "/local-contacts" },
          { label: t("breadcrumbCurrent") },
        ]}
      />

      {/* Header row */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-8 md:px-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold leading-tight text-market-navy md:text-3xl">
              {t("heading")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <HeaderSearch
            initialQuery={query}
            activeCategory={activeCategory}
            placeholder={t("searchPlaceholder")}
            allCategoriesLabel={t("allCategories")}
            categoryLabels={categoryLabels}
          />
        </div>
      </section>

      {/* Directory body */}
      <section className="bg-muted/30">
        <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-8 md:px-6 lg:grid-cols-[240px_1fr]">
          <CategorySidebar locale={locale} activeCategory={activeCategory} query={query} />

          <div className="flex flex-col gap-6">
            {institutions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {institutions.map((inst) => (
                  <InstitutionCard
                    key={inst.id}
                    acronym={inst.acronym}
                    name={pickLocalized(inst, "name", locale as Locale)}
                    description={pickLocalized(inst, "description", locale as Locale)}
                    city={inst.city}
                    category={inst.category}
                    categoryLabel={categoryLabels[inst.category] ?? t("category.other")}
                    website={inst.website}
                    viewDetailsLabel={t("viewDetails")}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
                <p className="text-sm font-semibold text-market-navy">{t("emptyTitle")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("emptySubtitle")}</p>
              </div>
            )}

            <GuidanceBanner locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}
