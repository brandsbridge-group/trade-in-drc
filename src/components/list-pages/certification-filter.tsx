import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FilterGroup, FilterItem } from "@/components/design";
import { mergeFilterHref, type FilterParams } from "./filter-url";

/**
 * Certification facet (Req 5 — faceted filters). `companies.certifications` is
 * a text[] of badge labels (e.g. "ISO 9001", "Fairtrade"). We collect the
 * distinct values across verified companies and let the user filter by one.
 * Selecting a certification merges a `cert` param into the URL; the list pages
 * apply it via a `contains` array filter on `certifications`.
 *
 * Verified companies are readable by anon callers under the base-table RLS
 * (`companies_public_read_verified`), so the base `companies` table is the
 * source here — `companies_public` does not project the certifications array.
 */
export async function CertificationFilter({
  locale,
  activeCert,
  basePath,
  params = {},
}: {
  locale: string;
  activeCert?: string;
  basePath: string;
  params?: FilterParams;
}) {
  const t = await getTranslations({ locale, namespace: "ListPages.filters" });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("companies")
    .select("certifications")
    .eq("status", "verified");

  const certs = Array.from(
    new Set(
      ((data ?? []) as { certifications: string[] | null }[])
        .flatMap((r) => r.certifications ?? [])
        .map((c) => c?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort((a, b) => a.localeCompare(b, locale));

  if (certs.length === 0) return null;

  return (
    <FilterGroup label={t("certification")}>
      <FilterItem
        label={t("any")}
        href={mergeFilterHref(basePath, params, "cert", undefined)}
        active={!activeCert}
      />
      {certs.map((cert) => (
        <FilterItem
          key={cert}
          label={cert}
          href={mergeFilterHref(basePath, params, "cert", cert)}
          active={activeCert === cert}
        />
      ))}
    </FilterGroup>
  );
}
