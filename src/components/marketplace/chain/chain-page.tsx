import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  SearchX,
  Sparkles,
  X,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CHAIN_CONFIG,
  INSTITUTION_FACTS,
  pickFact,
  type ChainKey,
  type ProviderChainKey,
} from "@/lib/marketplace/chain";
import { initialsOf, originOf } from "@/lib/marketplace/offers";
import {
  AddToOperationButton,
  BTN_PRIMARY,
  OperationBar,
  ProviderContactButton,
} from "./chain-client-bits";
import { ChainRequestForm } from "./chain-request-form";

type SearchParams = Record<string, string | undefined>;

/** One card, whatever the source (company segment or institution). */
interface Provider {
  id: string;
  kind: "company" | "institution";
  name: string;
  href: string | null;
  place: string | null;
  logo: string | null;
  badge: "verified" | "pending" | "official";
  chips: string[];
  facts: { key: string; value: string | null }[];
  ownerId: string | null;
  website: string | null;
  coverage: number;
}

interface ProviderRow {
  specialties: string[] | null;
  attributes: unknown;
  company: {
    id: string;
    name: string;
    city: string | null;
    province: string | null;
    logo_url: string | null;
    verification_tier: string | null;
    owner_id: string;
  };
}

interface InstitutionRow {
  id: string;
  acronym: string;
  name_en: string;
  name_fr: string;
  category: string;
  city: string | null;
  province: string | null;
  website: string | null;
  obtain_en: string | null;
  obtain_fr: string | null;
  access_en: string | null;
  access_fr: string | null;
}

type Supabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const joinPlace = (...parts: (string | null)[]) =>
  [...new Set(parts.filter(Boolean))].join(" · ") || null;

async function loadCompanyProviders(
  supabase: Supabase,
  segment: ProviderChainKey,
  locale: string,
): Promise<Provider[]> {
  const { data } = await supabase
    .from("company_segments")
    .select(
      "specialties, attributes, company:companies!inner(id, name, city, province, logo_url, verification_tier, owner_id, status)",
    )
    .eq("segment_key", segment)
    .eq("company.status", "verified");

  const facts = CHAIN_CONFIG[segment].facts;
  return ((data ?? []) as unknown as ProviderRow[]).map(({ specialties, attributes, company: c }) => ({
    id: c.id,
    kind: "company" as const,
    name: c.name,
    href: `/companies/${c.id}`,
    place: joinPlace(c.city, c.province),
    logo: c.logo_url,
    badge:
      c.verification_tier === "verified" || c.verification_tier === "premium"
        ? ("verified" as const)
        : ("pending" as const),
    chips: specialties ?? [],
    facts: facts.map((key) => ({ key, value: pickFact(attributes, key, locale) })),
    ownerId: c.owner_id,
    website: null,
    coverage: (specialties ?? []).length,
  }));
}

async function loadInstitutions(supabase: Supabase, locale: string): Promise<Provider[]> {
  const tCat = await getTranslations("Institutions.category");
  // `institutions` isn't in the typed schema (see contact-points/page.tsx).
  const { data } = await (supabase as unknown as {
    from(t: string): { select(c: string): Promise<{ data: InstitutionRow[] | null }> };
  })
    .from("institutions")
    .select(
      "id, acronym, name_en, name_fr, category, city, province, website, obtain_en, obtain_fr, access_en, access_fr",
    );

  const fr = locale === "fr";
  return (data ?? []).map((i) => ({
    id: i.id,
    kind: "institution" as const,
    name: `${i.acronym} — ${fr ? i.name_fr : i.name_en}`,
    href: null,
    place: joinPlace(i.city, i.province),
    logo: null,
    badge: "official" as const,
    chips: [`c-${i.category}`, ...(i.province ? [`p-${i.province}`] : [])],
    facts: [
      { key: "competence", value: tCat.has(i.category) ? tCat(i.category) : null },
      { key: "obtain", value: (fr ? i.obtain_fr : i.obtain_en) ?? i.obtain_en },
      { key: "province", value: i.province },
      { key: "access", value: (fr ? i.access_fr : i.access_en) ?? i.access_en },
    ],
    ownerId: null,
    website: i.website,
    coverage: 0,
  }));
}

/** Optional `?for=<product id>` context: the offer this operation is about. */
async function loadContext(supabase: Supabase, productId: string | undefined) {
  if (!productId || !/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const { data } = await supabase
    .from("products")
    .select("id, name, company:companies(city, country, registration_profile)")
    .eq("id", productId)
    .maybeSingle();
  if (!data) return null;
  const c = (data as unknown as {
    company: { city: string | null; country: string | null; registration_profile: string | null } | null;
  }).company;
  return {
    id: data.id,
    name: data.name,
    origin: originOf(c?.registration_profile ?? null),
    place: c?.city ?? c?.country ?? null,
  };
}

function qs(sp: SearchParams, patch: Record<string, string | null>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * A chain page — "who handles this step of my operation?". Navy header with
 * the two ways in (choose yourself / delegate to the team), an optional
 * product context, filter chips, provider cards with four trade-specific
 * facts, and the fallback request form. "Add to my operation" collects
 * providers across the four pages (OperationBar).
 */
export async function ChainPage({
  segment,
  searchParams: sp,
}: {
  segment: ChainKey;
  searchParams: SearchParams;
}) {
  const t = await getTranslations("MarketChain");
  const tSeg = await getTranslations(`MarketChain.segments.${segment}`);
  const loc = await getLocale();
  const supabase = await createServerSupabaseClient();

  const [providers, context, auth] = await Promise.all([
    segment === "institutions"
      ? loadInstitutions(supabase, loc)
      : loadCompanyProviders(supabase, segment, loc),
    loadContext(supabase, sp.for),
    supabase.auth.getUser(),
  ]);
  const viewer = auth.data.user;

  // Chips: fixed per trade; for institutions, whatever categories / provinces exist.
  const chipKeys =
    segment === "institutions"
      ? [...new Set(providers.flatMap((p) => p.chips))].sort()
      : [...CHAIN_CONFIG[segment].chips];
  const chipLabel = (key: string) => {
    if (segment !== "institutions") return tSeg(`chips.${key}`);
    const i = providers.find((p) => p.chips.includes(key));
    return key.startsWith("p-")
      ? key.slice(2)
      : (i?.facts.find((f) => f.key === "competence")?.value ?? key.slice(2));
  };
  const active = sp.f && chipKeys.includes(sp.f) ? sp.f : null;

  const shown = providers
    .filter((p) => !active || p.chips.includes(active))
    .sort(
      (a, b) =>
        Number(b.badge !== "pending") - Number(a.badge !== "pending") ||
        b.coverage - a.coverage ||
        a.name.localeCompare(b.name),
    );

  const factLabels =
    segment === "institutions" ? INSTITUTION_FACTS : CHAIN_CONFIG[segment].facts;
  const ctaLabel =
    segment === "institutions"
      ? t("actions.procedure")
      : t(`actions.${CHAIN_CONFIG[segment].cta}`);

  return (
    <div className="bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-market-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-primary/40 blur-[120px]" />
          <div className="absolute -bottom-40 right-[-10%] h-[380px] w-[380px] rounded-full bg-market-or/10 blur-[120px]" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 md:px-6 md:pb-12">
          <nav aria-label={t("breadcrumbLabel")} className="flex flex-wrap items-center gap-1 text-xs text-white/55">
            <Link href="/market" className="transition-colors duration-150 ease-out hover:text-white">
              {t("breadcrumb.market")}
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link href="/market#chain" className="transition-colors duration-150 ease-out hover:text-white">
              {t("breadcrumb.chain")}
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="text-white/85" aria-current="page">
              {tSeg("title")}
            </span>
          </nav>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-market-or">
            {tSeg("eyebrow")}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight md:text-[40px]">
            {tSeg("question")}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/70">{tSeg("lead")}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/15 backdrop-blur-sm md:p-6">
              <h2 className="font-display text-lg font-bold">{t("choose.title")}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/65">{t("choose.body")}</p>
              <a
                href="#providers"
                className="group mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-market-or-light transition-colors duration-150 ease-out hover:text-white"
              >
                {t("choose.cta")}
                <ArrowDown
                  className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-y-0.5"
                  aria-hidden
                />
              </a>
            </div>
            <div className="flex flex-col rounded-2xl bg-white p-5 text-[var(--color-landing-navy)] shadow-2xl shadow-black/20 md:p-6">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold">{t("delegate.title")}</h2>
                <Sparkles className="h-4 w-4 text-market-or" aria-hidden />
              </div>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{t("delegate.body")}</p>
              <Link
                href="/services"
                className="group mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-market-or px-4 py-2.5 text-[13px] font-bold text-market-navy transition-colors duration-150 ease-out hover:bg-market-or-dark"
              >
                {t("delegate.cta")}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product context ─────────────────────────────────────── */}
      {context && (
        <div className="border-b border-market-or/25 bg-market-or/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div>
              <p className="text-sm font-bold text-[var(--color-landing-navy)]">
                {t("context.title", {
                  name: context.name,
                  direction: t(`context.${context.origin}`),
                })}
                {context.place && <span className="font-medium text-slate-600"> · {context.place}</span>}
              </p>
              <p className="text-xs text-slate-600">{t("context.body")}</p>
            </div>
            <Link
              href={`/market/${segment}${qs(sp, { for: null })}`}
              className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:text-primary"
            >
              {t("context.clear")}
              <X className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {/* ── Providers ───────────────────────────────────────────── */}
      <section id="providers" className="scroll-mt-16">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
          {chipKeys.length > 0 && (
            <nav aria-label={t("filterLabel")} className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
              <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
                {[null, ...chipKeys].map((key) => {
                  const on = key === active;
                  const n = key ? providers.filter((p) => p.chips.includes(key)).length : providers.length;
                  return (
                    <li key={key ?? "all"}>
                      <Link
                        href={`/market/${segment}${qs(sp, { f: on ? null : key })}#providers`}
                        scroll={false}
                        aria-current={on ? "true" : undefined}
                        className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold ring-1 transition-colors duration-150 ease-out",
                          on
                            ? "bg-[var(--color-landing-navy)] text-white ring-[var(--color-landing-navy)]"
                            : "bg-white text-[var(--color-landing-navy)] ring-slate-200 hover:ring-slate-300",
                        )}
                      >
                        {key ? chipLabel(key) : t("all")}
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[11px] tabular-nums",
                            on ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {n}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          <div className="mt-6 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-landing-navy)]">
              {t(segment === "institutions" ? "countInstitutions" : "count", { count: shown.length })}
            </h2>
            {shown.length > 1 && <span className="text-xs text-slate-500">{t("sorted")}</span>}
          </div>

          {shown.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <SearchX className="h-8 w-8 text-slate-400" aria-hidden />
              <p className="font-semibold text-[var(--color-landing-navy)]">
                {t(active ? "empty.title" : "empty.noneTitle")}
              </p>
              <p className="max-w-md text-sm text-slate-500">{t("empty.body")}</p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {active && (
                  <Link
                    href={`/market/${segment}${qs(sp, { f: null })}#providers`}
                    scroll={false}
                    className="rounded-xl px-4 py-2 text-[13px] font-semibold text-[var(--color-landing-navy)] ring-1 ring-slate-200 transition-colors duration-150 ease-out hover:bg-slate-50"
                  >
                    {t("empty.reset")}
                  </Link>
                )}
                <a href="#chain-request" className={BTN_PRIMARY}>
                  {t("empty.ask")}
                </a>
              </div>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {shown.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-shadow duration-150 ease-out hover:shadow-md md:p-6"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-xl bg-market-navy text-[13px] font-bold text-white">
                      {p.logo ? (
                        // Company logos live on arbitrary hosts — plain img.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo} alt="" className="h-full w-full bg-white object-contain p-1" />
                      ) : (
                        initialsOf(p.name)
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-[17px] font-bold leading-snug text-[var(--color-landing-navy)]">
                        {p.href ? (
                          <Link
                            href={p.href}
                            className="transition-colors duration-150 ease-out hover:text-primary"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          p.name
                        )}
                      </h3>
                      {p.place && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {p.place}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex-none rounded-full px-2.5 py-1 text-[11px] font-bold",
                        p.badge === "pending"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                      )}
                    >
                      {t(`badges.${p.badge}`)}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 md:grid-cols-4">
                    {p.facts.map((f, i) => (
                      <div key={f.key} className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                          {tSeg(`facts.${factLabels[i]}`)}
                        </dt>
                        <dd className="mt-1 text-[13.5px] font-medium leading-snug text-[var(--color-landing-navy)]">
                          {f.value ?? <span className="text-slate-400">—</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {p.kind === "company" && p.ownerId ? (
                      <ProviderContactButton
                        label={ctaLabel}
                        signedIn={!!viewer}
                        viewerId={viewer?.id ?? null}
                        companyId={p.id}
                        companyName={p.name}
                        companyOwnerId={p.ownerId}
                      />
                    ) : (
                      <Link
                        href={p.website ?? "/contact-points"}
                        {...(p.website ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={BTN_PRIMARY}
                      >
                        {ctaLabel}
                        {p.website && <ExternalLink className="h-3.5 w-3.5" aria-hidden />}
                      </Link>
                    )}
                    <AddToOperationButton
                      item={{ id: p.id, name: p.name, segment, kind: p.kind }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Fallback request ───────────────────────────────────── */}
      <section id="chain-request" className="scroll-mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-28 pt-12 md:px-6 md:pb-32 md:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-landing-navy)] md:text-[28px]">
              {t("request.title")}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">{t("request.body")}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-market-or/10 px-3 py-1.5 text-[13px] font-semibold text-[var(--color-landing-navy)]">
              <Clock className="h-4 w-4 text-market-or-dark" aria-hidden />
              {t("request.sla")}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/70 md:p-7">
            <ChainRequestForm
              segment={segment}
              signedIn={!!viewer}
              defaultNature={context?.name}
              forProduct={context?.id}
            />
          </div>
        </div>
      </section>

      <OperationBar />
    </div>
  );
}
