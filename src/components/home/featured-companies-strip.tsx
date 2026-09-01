import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowRight, Star } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { MotionEnter } from "@/components/home/motion-enter";
import { SkeletonImage } from "@/components/design";
import type { VerificationTier } from "@/lib/trust/types";

/**
 * Admin-curated homepage company spotlight (cluster C4). Reads `featured_companies`
 * (00016) joined to `companies`. RLS exposes only active features + verified
 * companies, so this renders nothing when there is nothing to show. Marketing
 * surface: Jakub enter recipe via MotionEnter; per-card hover is Emil restraint.
 */
export async function FeaturedCompaniesStrip({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.featured" });
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("featured_companies")
    .select(
      "id, sort_order, companies(id, name, logo_url, description, verification_tier, status)"
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const companies = (data ?? [])
    .map((row) => {
      const c = Array.isArray(row.companies) ? row.companies[0] : row.companies;
      return c as {
        id: string;
        name: string;
        logo_url: string | null;
        description: string | null;
        verification_tier: VerificationTier | null;
        status: string;
      } | null;
    })
    .filter(
      (c): c is NonNullable<typeof c> => Boolean(c) && c!.status === "verified"
    );

  if (companies.length === 0) return null;

  return (
    <MotionEnter>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Star className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h2>
          </div>
          <Link
            href="/companies"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors duration-150 ease-out hover:text-primary/80 sm:inline-flex"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const tier = (company.verification_tier ?? "none") as VerificationTier;
            return (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-150 ease-out hover:border-slate-300"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {company.logo_url ? (
                    <SkeletonImage
                      src={company.logo_url}
                      alt=""
                      wrapperClassName="h-full w-full rounded-xl"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {company.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {company.name}
                    </span>
                    <VerificationBadge tier={tier} />
                  </div>
                  {company.description && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {company.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </MotionEnter>
  );
}
