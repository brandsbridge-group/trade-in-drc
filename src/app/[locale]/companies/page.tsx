import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Gem, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/locales";
import { COMPANY_STATUS, VERIFICATION_TIER } from "@/constants/status";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { BLUR } from "@/components/home/landing/blur-data";
import { CompanyCard, type DirectoryCompany } from "@/components/companies/market/company-card";
import { DirectoryFilters } from "@/components/companies/market/directory-filters";
import {
  DIRECTORY_PAGE_SIZE,
  DIRECTORY_SORT,
  directoryHref,
  likePattern,
  pageCount,
  pageWindow,
  parseDirectoryParams,
} from "@/lib/companies/directory";

interface CompanyRow {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  verification_tier: string | null;
  is_premium: boolean;
  city: string | null;
  province: string | null;
  country: string | null;
  sector_id: string | null;
  year_established: string | null;
}

interface SectorRow {
  id: string;
  name_en: string | null;
  name_fr: string | null;
  name_tr: string | null;
  name_zh: string | null;
  name_es: string | null;
}

// Only the founding year is read out of `verification_summary` — the JSON also
// holds legal identifiers and the contact person, which stay server-side.
const LIST_COLUMNS =
  "id, name, logo_url, description, verification_tier, is_premium, city, province, country, sector_id, year_established:verification_summary->registration_intake->legal->>year_established";

/**
 * Public directory of verified companies. Server-rendered: the URL carries the
 * search, filters, sort and page (`parseDirectoryParams`), and every figure and
 * filter option comes from the companies actually published. Boxed layout: the
 * navy hero background is full-width, all content sits in the max-w-6xl box
 * shared with the homepage sections.
 */
export default async function CompaniesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const filters = parseDirectoryParams(await searchParams);
  const t = await getTranslations({ locale, namespace: "VerifiedDirectory.page" });
  const supabase = await createServerSupabaseClient();

  // The whole published directory, three small columns: it gives the hero
  // figures and the filter options that have at least one company behind them.
  const [{ data: sectorData }, { data: facetData }] = await Promise.all([
    supabase.from("sectors").select("id, name_en, name_fr, name_tr, name_zh, name_es"),
    supabase.from("companies").select("sector_id, country, province").eq("status", COMPANY_STATUS.VERIFIED).limit(5000),
  ]);
  const facets = (facetData ?? []) as { sector_id: string | null; country: string | null; province: string | null }[];
  const sectorLabelById = new Map(((sectorData ?? []) as unknown as SectorRow[]).map((s) => [s.id, pickLocalized(s, "name", locale as Locale)]));
  const distinct = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v?.trim())))].sort((a, b) => a.localeCompare(b));

  const usedSectors = new Set(facets.map((f) => f.sector_id));
  const sectorOptions = [...sectorLabelById]
    .filter(([id, label]) => usedSectors.has(id) && label)
    .map(([id, label]) => ({ value: id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const countries = distinct(facets.map((f) => f.country));
  const provinces = distinct(facets.filter((f) => !filters.country || f.country === filters.country).map((f) => f.province));

  let query = supabase.from("companies").select(LIST_COLUMNS, { count: "exact" }).eq("status", COMPANY_STATUS.VERIFIED);
  if (filters.q) query = query.ilike("name", likePattern(filters.q));
  if (filters.sector) query = query.eq("sector_id", filters.sector);
  if (filters.country) query = query.eq("country", filters.country);
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.premiumOnly) query = query.or(`verification_tier.eq.${VERIFICATION_TIER.PREMIUM},is_premium.eq.true`);
  query = filters.sort === DIRECTORY_SORT.AZ ? query.order("name", { ascending: true }) : query.order("created_at", { ascending: false });

  const offset = (filters.page - 1) * DIRECTORY_PAGE_SIZE;
  const { data, count } = await query.order("id", { ascending: true }).range(offset, offset + DIRECTORY_PAGE_SIZE - 1);
  const rows = (data ?? []) as unknown as CompanyRow[];
  const total = count ?? 0;
  const pages = pageCount(total);
  const ids = rows.map((r) => r.id);

  // What each listed company put online: its first gallery photo and its published products.
  const [{ data: mediaData }, { data: productData }] = ids.length
    ? await Promise.all([
        supabase
          .from("company_media")
          .select("company_id, url")
          .eq("kind", "gallery")
          .in("company_id", ids)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.from("products").select("company_id").eq("is_published", true).in("company_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const coverByCompany = new Map<string, string>();
  for (const media of (mediaData ?? []) as { company_id: string; url: string }[]) {
    if (!coverByCompany.has(media.company_id)) coverByCompany.set(media.company_id, media.url);
  }
  const productsByCompany = new Map<string, number>();
  for (const product of (productData ?? []) as { company_id: string }[]) {
    productsByCompany.set(product.company_id, (productsByCompany.get(product.company_id) ?? 0) + 1);
  }

  const companies: DirectoryCompany[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    logo_url: r.logo_url,
    cover_url: coverByCompany.get(r.id) ?? null,
    description: r.description,
    premium: r.is_premium || r.verification_tier === VERIFICATION_TIER.PREMIUM,
    city: r.city,
    province: r.province,
    country: r.country,
    sectorLabel: r.sector_id ? sectorLabelById.get(r.sector_id) ?? "" : "",
    productCount: productsByCompany.get(r.id) ?? 0,
    yearEstablished: r.year_established?.trim() || null,
  }));

  const stats = [
    { label: t("stats.companies"), value: facets.length },
    { label: t("stats.sectors"), value: sectorOptions.length },
    countries.length > 1
      ? { label: t("stats.countries"), value: countries.length }
      : { label: t("stats.provinces"), value: distinct(facets.map((f) => f.province)).length },
  ].filter((stat) => stat.value > 0);

  const steps = [1, 2, 3].map((n) => ({ n, title: t(`trust.step${n}Title`), body: t(`trust.step${n}Body`) }));

  return (
    <>
      <BreadcrumbBar boxed items={[{ label: t("crumb") }]} />

      <section className="relative isolate overflow-hidden bg-market-navy text-white">
        {/* The DRC network map from the homepage's closing band, large on the
            right. The mask fades its square edges into the navy; hidden on
            phones, where the text needs the whole width. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] md:block [mask-image:radial-gradient(ellipse_at_62%_50%,black_38%,transparent_72%)]"
          aria-hidden
        >
          <Image
            src="/images/landing/drc-map.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 62vw, 0px"
            placeholder="blur"
            blurDataURL={BLUR.drcMap}
            className="scale-[1.35] object-contain mix-blend-lighten"
          />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-market-or-light">{t("eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-[44px]">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/75">{t("subtitle")}</p>

          {/* A plain GET form: the name search works without JavaScript and keeps the other filters. */}
          <form action={`/${locale}/companies`} method="get" role="search" className="mt-7 flex max-w-2xl items-center gap-2 rounded-full bg-white p-1.5 pl-5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-market-navy outline-none placeholder:text-slate-400"
            />
            {filters.sector && <input type="hidden" name="sector" value={filters.sector} />}
            {filters.country && <input type="hidden" name="country" value={filters.country} />}
            {filters.province && <input type="hidden" name="province" value={filters.province} />}
            {filters.premiumOnly && <input type="hidden" name="tier" value="premium" />}
            {filters.sort !== DIRECTORY_SORT.RECENT && <input type="hidden" name="sort" value={filters.sort} />}
            <button
              type="submit"
              className="shrink-0 rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep"
            >
              {t("searchButton")}
            </button>
          </form>

          {stats.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-3xl font-semibold text-white">{stat.value}</dd>
                  <dt className="mt-0.5 text-[13px] text-white/65">{stat.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div data-page-end="flush" className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
          <DirectoryFilters params={filters} sectors={sectorOptions} countries={countries} provinces={provinces} />

          <p className="mt-6 text-sm font-medium text-slate-600" role="status">
            {t("results", { total })}
          </p>

          {companies.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-slate-200/70">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
              <h2 className="mt-3 font-display text-lg font-semibold text-market-navy">{t("empty.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("empty.body")}</p>
              <Link
                href="/companies"
                className="mt-5 inline-flex items-center rounded-full bg-market-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-market-navy-deep"
              >
                {t("empty.reset")}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <li key={company.id}>
                  <CompanyCard
                    company={company}
                    labels={{
                      verified: t("card.verified"),
                      premium: t("card.premium"),
                      view: t("card.view"),
                      open: t("card.open", { name: company.name }),
                      products: company.productCount > 0 ? t("card.products", { count: company.productCount }) : null,
                      founded: company.yearEstablished ? t("card.founded", { year: company.yearEstablished }) : null,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label={t("pagination.label")} className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
              <PageLink href={filters.page > 1 ? directoryHref(filters, { page: filters.page - 1 }) : null} label={t("pagination.previous")}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </PageLink>
              {pageWindow(filters.page, pages).map((page, index) =>
                page === null ? (
                  <span key={`gap-${index}`} className="px-1 text-slate-400" aria-hidden>…</span>
                ) : (
                  <Link
                    key={page}
                    href={directoryHref(filters, { page })}
                    aria-label={t("pagination.page", { page })}
                    aria-current={page === filters.page ? "page" : undefined}
                    className={cn(
                      "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors",
                      page === filters.page ? "bg-market-navy text-white" : "bg-white text-market-navy ring-1 ring-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {page}
                  </Link>
                )
              )}
              <PageLink href={filters.page < pages ? directoryHref(filters, { page: filters.page + 1 }) : null} label={t("pagination.next")}>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </PageLink>
            </nav>
          )}

          {/* What a badge means, and how a company earns its place here. */}
          <section aria-labelledby="directory-trust" className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 lg:col-span-5">
              <h2 id="directory-trust" className="font-display text-lg font-semibold text-market-navy">{t("trust.title")}</h2>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700" aria-hidden>
                    <BadgeCheck className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-market-navy">{t("trust.verifiedTitle")}</p>
                    <p className="text-[13px] leading-relaxed text-slate-600">{t("trust.verifiedBody")}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-market-or/15 text-market-or-dark" aria-hidden>
                    <Gem className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-market-navy">{t("trust.premiumTitle")}</p>
                    <p className="text-[13px] leading-relaxed text-slate-600">{t("trust.premiumBody")}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 lg:col-span-7">
              <h2 className="font-display text-lg font-semibold text-market-navy">{t("trust.stepsTitle")}</h2>
              <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {steps.map((step) => (
                  <li key={step.n} className="rounded-xl bg-slate-50 p-4">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-market-navy text-xs font-semibold text-white" aria-hidden>{step.n}</span>
                    <p className="mt-3 text-sm font-semibold text-market-navy">{step.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="relative mt-4 overflow-hidden rounded-3xl bg-market-navy px-6 py-8 text-white sm:px-10">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-market-or/25 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t("cta.title")}</h2>
                <p className="mt-1.5 text-[15px] text-white/75">{t("cta.body")}</p>
              </div>
              <Link
                href="/register-company"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-market-or px-6 py-3 text-sm font-semibold text-market-navy transition-colors hover:bg-market-or-light"
              >
                {t("cta.button")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/** Previous / next arrow: a link when there is a page to go to, an inert icon otherwise. */
function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const base = "grid h-10 w-10 place-items-center rounded-full ring-1 ring-slate-200";
  return href ? (
    <Link href={href} aria-label={label} className={cn(base, "bg-white text-market-navy transition-colors hover:bg-slate-100")}>
      {children}
    </Link>
  ) : (
    <span aria-hidden className={cn(base, "bg-slate-100 text-slate-300")}>
      {children}
    </span>
  );
}
