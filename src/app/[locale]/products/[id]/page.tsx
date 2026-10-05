import { cache } from "react";
import { specEntries, toSpecFields } from "@/lib/products/specs";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  EyeOff,
  Factory,
  FileCheck2,
  Globe2,
  Languages,
  Lock,
  MapPin,
  MapPinned,
  Package,
  Receipt,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toVerificationFacts } from "@/lib/marketplace/verification-facts";
import { offerExcerpt } from "@/components/marketplace/products/offer-card-data";
import { pricingDisplay, pricingOf } from "@/lib/products/pricing";
import {
  cardFacts,
  initialsOf,
  offerVisual,
  originOf,
  placeOf,
  tierGroup,
} from "@/lib/marketplace/offers";
import { OfferCard, type OfferCardData } from "@/components/marketplace/products/offer-card";
import { OfferGallery } from "@/components/marketplace/offer-detail/offer-gallery";
import { OfferRequestForm } from "@/components/marketplace/offer-detail/offer-request-form";
import {
  OfferDirectContact,
  OfferViewTracker,
} from "@/components/marketplace/offer-detail/offer-client-bits";

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RELATED_COUNT = 4;

const VERIFY_ICONS = {
  legal: Building2,
  tax: Receipt,
  export: FileCheck2,
  references: Users,
  site: MapPinned,
} as const;

const TERM_ICONS = {
  moq: Package,
  leadTime: Timer,
  capacity: Factory,
  languages: Languages,
  markets: Globe2,
  certifications: Award,
} as const;

interface CategoryRef {
  id: string;
  slug: string | null;
  name_en: string | null;
  name_fr: string | null;
  /** The category's specification template (00055). */
  category_spec_fields?: unknown;
}

interface CompanyDetail {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  owner_id: string;
  city: string | null;
  province: string | null;
  country: string | null;
  registration_profile: string | null;
  status: string;
  verification_tier: string | null;
  verified_at: string | null;
  created_at: string;
  moq: string | null;
  lead_time: string | null;
  production_capacity: string | null;
  markets: string[] | null;
  spoken_languages: string[] | null;
  certifications: string[] | null;
}

interface ProductDetail {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  images: string[] | null;
  specs: unknown;
  /** The seller's own switch (00057); false = hidden from the marketplace. */
  is_published: boolean;
  company_id: string;
  categories: CategoryRef | null;
  companies: CompanyDetail | null;
}

interface RelatedRow {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_fr: string | null;
  images: string[] | null;
  specs: unknown;
  categories: CategoryRef | null;
}

/** One fetch shared by generateMetadata and the page. */
const loadProduct = cache(async (id: string): Promise<ProductDetail | null> => {
  if (!UUID_SHAPE.test(id)) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, name_en, name_fr, description, description_en, description_fr, images, specs, price, price_currency, sale_unit, min_order_quantity, is_published, company_id, categories(id, slug, name_en, name_fr, category_spec_fields(key, label_en, label_fr, field_type, unit, options, required, sort_order)), companies(id, name, slug, logo_url, owner_id, city, province, country, registration_profile, status, verification_tier, verified_at, created_at, moq, lead_time, production_capacity, markets, spoken_languages, certifications)",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as ProductDetail | null) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const p = await loadProduct(id);
  if (!p) return {};
  const title = pickLocalized(p, "name", locale as Locale) || p.name;
  const description =
    (pickLocalized(p, "description", locale as Locale) || p.description || "").slice(0, 160) ||
    undefined;
  // The seller's cover photo is what a shared link shows.
  const cover = p.images?.[0];
  return {
    title,
    description,
    openGraph: { title, description, type: "website", ...(cover ? { images: [cover] } : {}) },
  };
}

/**
 * Offer detail. A navy header band (same atmosphere as the marketplace hero)
 * carries the offer's identity and visual; below, the offer, what the team
 * verified about the seller, the seller, specs and commercial terms, next to
 * the pinned two-step quote request. Everything comes from the current
 * schema — terms the seller has not filled in are simply left out.
 */
export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const product = await loadProduct(id);
  if (!product || !product.companies) notFound();

  const t = await getTranslations({ locale, namespace: "OfferDetail" });
  const tCard = await getTranslations({ locale, namespace: "MarketProducts" });
  const tPricing = await getTranslations({ locale, namespace: "ProductPricing" });
  const format = await getFormatter({ locale });
  const supabase = await createServerSupabaseClient();
  const c = product.companies;
  const loc = locale as Locale;

  // A product is public when it is published AND its company is verified (RLS,
  // 00057). Whoever else gets this far is the owner or staff, previewing it.
  const isPublic = product.is_published && c.status === "verified";

  const [{ data: factsData }, { data: relatedData }, viewer] = await Promise.all([
    supabase.rpc("company_public_verification", { p_company_id: c.id }),
    supabase
      .from("products")
      .select("id, name, name_en, name_fr, description, description_en, description_fr, images, specs, price, price_currency, sale_unit, min_order_quantity, categories(id, slug, name_en, name_fr, category_spec_fields(key, label_en, label_fr, field_type, unit, options, required, sort_order))")
      .eq("company_id", c.id)
      .eq("is_published", true)
      .neq("id", product.id)
      .order("created_at", { ascending: false })
      .limit(RELATED_COUNT),
    isPublic ? null : supabase.auth.getUser(),
  ]);
  const viewerIsOwner = viewer?.data.user?.id === c.owner_id;

  const origin = originOf(c.registration_profile);
  const DirectionIcon = origin === "import" ? ArrowDownRight : ArrowUpRight;
  const fullyVerified = tierGroup(c.verification_tier) === "full";
  const name = pickLocalized(product, "name", loc) || product.name;
  const description = pickLocalized(product, "description", loc) || product.description;
  const categoryName = product.categories ? pickLocalized(product.categories, "name", loc) : null;
  const location = [c.city, placeOf(c)].filter(Boolean).join(", ");
  const yesNo = { yes: tCard("card.yes"), no: tCard("card.no") };
  const specs = specEntries(product.specs, {
    fields: toSpecFields(product.categories?.category_spec_fields),
    locale: loc,
    ...yesNo,
  });
  const images = product.images ?? [];
  const visual = offerVisual(images, product.categories?.slug ?? null);
  const memberSince = new Date(c.created_at).getFullYear();

  // "What we verified": four points read from the real verification circuit
  // (documents staff approved, approved references — 00063). A Congolese seller
  // files a tax registration; an international one has no equivalent, so its
  // second point is the trade licence instead.
  const facts = toVerificationFacts(factsData);
  const refs = facts.references;
  const secondPoint =
    origin === "export"
      ? ({ key: "tax", ok: facts.tax, body: t(facts.tax ? "verify.tax.ok" : "verify.tax.todo") } as const)
      : ({ key: "export", ok: facts.license, body: t(facts.license ? "verify.export.ok" : "verify.export.todo") } as const);
  const verifyItems = [
    { key: "legal", ok: facts.registration, body: t(facts.registration ? "verify.legal.ok" : "verify.legal.todo") },
    secondPoint,
    { key: "references", ok: refs > 0, body: refs > 0 ? t("verify.references.ok", { count: refs }) : t("verify.references.todo") },
    {
      key: "site",
      ok: facts.siteVisit,
      body: facts.siteVisit
        ? t("verify.site.ok")
        : t(origin === "import" ? "verify.site.todoAbroad" : "verify.site.todo"),
    },
  ] as const;
  const verifiedCount = verifyItems.filter((v) => v.ok).length;

  // The product's own price and minimum order (00064).
  const pricing = pricingDisplay(product, tPricing, locale);

  // Commercial terms the seller has actually filled in; the product's minimum
  // order, when stated, replaces the company-wide one.
  const joinList = (v: string[] | null) => (v && v.length > 0 ? v.join(", ") : null);
  const terms = (
    [
      { key: "moq", value: pricing.minOrder ?? c.moq },
      { key: "leadTime", value: c.lead_time },
      { key: "capacity", value: c.production_capacity },
      { key: "languages", value: joinList(c.spoken_languages) },
      { key: "markets", value: joinList(c.markets) },
      { key: "certifications", value: joinList(c.certifications) },
    ] as const
  ).filter((x): x is typeof x & { value: string } => !!x.value);

  const related: OfferCardData[] = ((relatedData ?? []) as unknown as RelatedRow[]).map((r) => ({
    id: r.id,
    name: pickLocalized(r, "name", loc) || r.name,
    excerpt: offerExcerpt(pickLocalized(r, "description", loc) || r.description),
    photoCount: r.images?.length ?? 0,
    pricing: pricingOf(r),
    category: r.categories ? pickLocalized(r.categories, "name", loc) : null,
    verified: fullyVerified,
    supplier: c.name,
    supplierLogo: c.logo_url,
    supplierInitials: initialsOf(c.name),
    location: location || null,
    visual: offerVisual(r.images, r.categories?.slug ?? null),
    facts: cardFacts(
      pricingOf(r).min_order_quantity !== null ? { ...c, moq: null } : c,
      r.specs,
      { moq: tCard("card.moq"), leadTime: tCard("card.leadTime"), ...yesNo },
      { fields: r.categories?.category_spec_fields, locale: loc },
    ),
  }));

  const directionHref = `/products?origin=${origin}`;
  const reportHref = c.slug ? `/trust/${c.slug}` : "/trust";
  const CARD = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6";
  const H2 = "font-display text-lg font-bold text-[var(--color-landing-navy)]";

  // Logo or monogram; `onDark` inverts the monogram for the navy header band.
  const supplierAvatar = (onDark: boolean) =>
    c.logo_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={c.logo_url}
        alt=""
        className="h-11 w-11 flex-none rounded-full bg-white object-contain ring-1 ring-slate-200"
      />
    ) : (
      <span
        aria-hidden
        className={`grid h-11 w-11 flex-none place-items-center rounded-full text-sm font-bold ${
          onDark
            ? "bg-white text-[var(--color-landing-navy)] ring-4 ring-white/10"
            : "bg-[var(--color-landing-navy)] text-white"
        }`}
      >
        {initialsOf(c.name)}
      </span>
    );

  return (
    <div className="bg-slate-50 pb-20 lg:pb-0">
      {isPublic ? (
        <OfferViewTracker productId={product.id} />
      ) : (
        // Owner or staff previewing a product visitors cannot open yet.
        <div role="status" className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-6">
            <p className="flex min-w-0 flex-1 basis-[260px] items-start gap-2 text-[13px] text-amber-900">
              <EyeOff className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
              {t(c.status === "verified" ? "preview.hidden" : "preview.unverified")}
            </p>
            {viewerIsOwner && (
              <Link
                href={`/dashboard/products/${product.id}`}
                className="inline-flex flex-none items-center gap-1 rounded-full bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-amber-950"
              >
                {t("preview.manage")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Header band */}
      <section className="relative isolate overflow-hidden bg-market-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 -top-32 h-[380px] w-[380px] rounded-full bg-primary/40 blur-[110px]" />
          <div className="absolute -bottom-40 right-[-5%] h-[340px] w-[340px] rounded-full bg-market-or/10 blur-[110px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_25%_35%,black_15%,transparent_65%)]" />
        </div>

        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <nav aria-label={t("breadcrumb")} className="flex flex-wrap items-center gap-1 text-xs text-white/60">
              <Link href="/market" className="transition-colors duration-150 ease-out hover:text-white">
                {t("crumbMarket")}
              </Link>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <Link href={directionHref} className="transition-colors duration-150 ease-out hover:text-white">
                {tCard(`directions.${origin}.title`)}
              </Link>
              {product.categories && (
                <>
                  <ChevronRight className="h-3 w-3" aria-hidden />
                  <Link
                    href={`${directionHref}&cat=${product.categories.id}`}
                    className="text-white/90 transition-colors duration-150 ease-out hover:text-white"
                  >
                    {categoryName}
                  </Link>
                </>
              )}
            </nav>

            <div className="mt-4 flex flex-wrap gap-2">
              {fullyVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  {c.verified_at
                    ? t("verifiedOn", {
                        date: format.dateTime(new Date(c.verified_at), { dateStyle: "long" }),
                      })
                    : tCard("card.verified")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-amber-300/30">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {tCard("card.pending")}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/85 ring-1 ring-white/15">
                <DirectionIcon className="h-3.5 w-3.5 text-market-or" aria-hidden />
                {t(`direction.${origin}`)}
              </span>
            </div>

            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              {name}
            </h1>

            <div className="mt-5 flex items-center gap-3">
              {supplierAvatar(true)}
              <div className="min-w-0">
                <Link
                  href={`/companies/${c.id}`}
                  className="font-semibold text-white transition-colors duration-150 ease-out hover:text-market-or"
                >
                  {c.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/65">
                  {location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    {t("memberSince", { year: memberSince })}
                  </span>
                </p>
              </div>
            </div>

            {/* Price and minimum order, as the seller stated them. */}
            <dl className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-white/10 pt-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-white/55">{tPricing("price")}</dt>
                <dd className="mt-0.5">
                  {pricing.price ? (
                    <>
                      <span className="font-display text-2xl font-extrabold tabular-nums text-white">{pricing.price}</span>{" "}
                      <span className="text-sm text-white/65">{tPricing("perUnit", { unit: pricing.unit ?? "" })}</span>
                    </>
                  ) : (
                    <span className="font-display text-lg font-bold text-white">{tPricing("onRequest")}</span>
                  )}
                </dd>
              </div>
              {pricing.minOrder && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-white/55">{tPricing("minOrder")}</dt>
                  <dd className="mt-0.5 font-display text-lg font-bold tabular-nums text-white">{pricing.minOrder}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Visual: the product gallery, or the category's sector artwork. */}
          <div className="overflow-hidden rounded-2xl bg-white/5 p-2 shadow-2xl shadow-black/30 ring-1 ring-white/15 backdrop-blur-md">
            {visual.illustrative ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src={visual.src}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                />
                <span className="absolute bottom-2 right-3 text-[10px] font-medium text-white/80">
                  {tCard("card.illustrative")}
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-2">
                <OfferGallery images={images} name={name} />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          {/* About the offer + specs */}
          {(description || specs.length > 0) && (
            <section className={CARD}>
              <h2 className={H2}>{t("about")}</h2>
              {description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {description}
                </p>
              )}
              {specs.length > 0 && (
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-baseline justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {s.label}
                      </dt>
                      <dd className="text-right text-[13px] font-semibold text-slate-800">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          )}

          {/* What we verified */}
          <section className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={`${H2} flex items-center gap-2`}>
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                {t("verify.title")}
              </h2>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600">
                  {t("verify.progress", { done: verifiedCount, total: verifyItems.length })}
                </span>
                <span aria-hidden className="flex gap-1">
                  {verifyItems.map((v) => (
                    <span
                      key={v.key}
                      className={`h-1.5 w-6 rounded-full ${v.ok ? "bg-emerald-500" : "bg-slate-200"}`}
                    />
                  ))}
                </span>
              </div>
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {verifyItems.map((item) => {
                const Icon = VERIFY_ICONS[item.key];
                return (
                  <li
                    key={item.key}
                    className={`flex gap-3 rounded-xl border p-3.5 ${
                      item.ok ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50/60"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${
                        item.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-[var(--color-landing-navy)]">
                          {t(`verify.${item.key}.title`)}
                        </p>
                        <span
                          className={`inline-flex flex-none items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            item.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.ok && <Check className="h-3 w-3" aria-hidden />}
                          {t(item.ok ? "verify.done" : "verify.pending")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
              {t("verify.scope")}
              <Link
                href={reportHref}
                className="group inline-flex items-center gap-1 font-semibold text-primary transition-colors duration-150 ease-out hover:text-[#003a8c]"
              >
                {t(c.slug ? "verify.report" : "verify.method")}
                <ArrowRight
                  className="h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </p>
          </section>

          {/* Commercial terms */}
          <section className={CARD}>
            <h2 className={H2}>{t("terms.title")}</h2>
            {terms.length > 0 ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {terms.map((term) => {
                  const Icon = TERM_ICONS[term.key];
                  return (
                    <div key={term.key} className="flex min-w-0 gap-2.5 rounded-xl bg-slate-50 p-3">
                      <Icon className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
                      <div className="min-w-0">
                        <dt className="text-[11px] text-slate-500">{t(`terms.${term.key}`)}</dt>
                        <dd className="mt-0.5 text-[13px] font-semibold text-slate-800">{term.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <div className="mt-3 flex gap-3 rounded-xl border border-dashed border-slate-300 p-4">
                <Package className="h-5 w-5 flex-none text-slate-400" aria-hidden />
                <p className="text-[13px] leading-relaxed text-slate-600">{t("terms.empty")}</p>
              </div>
            )}
          </section>

          {/* The supplier */}
          <section className={CARD}>
            <h2 className={H2}>{t("supplier.title")}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {supplierAvatar(false)}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-[var(--color-landing-navy)]">
                  {c.name}
                  {fullyVerified ? (
                    <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label={tCard("card.verified")} />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600" aria-label={tCard("card.pending")} />
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {[location, t("memberSince", { year: memberSince })].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/companies/${c.id}`}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-bold text-slate-700 transition-colors duration-150 ease-out hover:border-slate-300 hover:bg-slate-50"
                >
                  {t("supplier.profile")}
                </Link>
                <Link
                  href={reportHref}
                  className="rounded-lg border border-primary/30 px-3.5 py-2 text-[13px] font-bold text-primary transition-colors duration-150 ease-out hover:bg-primary/5"
                >
                  {t("supplier.report")}
                </Link>
              </div>
            </div>
          </section>

          {/* More from this supplier */}
          {related.length > 0 && (
            <section>
              <h2 className={H2}>{t("related", { company: c.name })}</h2>
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {related.map((o) => (
                  <li key={o.id}>
                    <OfferCard offer={o} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Quote request — pinned under the sticky navbar (h-16). */}
        <aside id="request" className="h-fit scroll-mt-20 lg:sticky lg:top-20">
          <section
            aria-labelledby="request-title"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5"
          >
            <div className="relative isolate overflow-hidden bg-market-navy px-5 py-4">
              <div
                aria-hidden
                className="absolute -right-10 -top-16 -z-10 h-40 w-40 rounded-full bg-primary/50 blur-[60px]"
              />
              <h2 id="request-title" className="font-display text-lg font-bold text-white">
                {t("request.title")}
              </h2>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-white/70">
                <Clock className="h-3.5 w-3.5 text-market-or" aria-hidden />
                {t("request.responseTime")}
              </p>
            </div>

            <div className="p-5">
              <OfferRequestForm productId={product.id} />

              <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <Lock className="mt-0.5 h-3.5 w-3.5 flex-none text-slate-400" aria-hidden />
                {t("request.privacy")}
              </p>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <OfferDirectContact
                  companyId={c.id}
                  companyName={c.name}
                  companyOwnerId={c.owner_id}
                />
                <p className="text-xs text-slate-600">{t("request.support")}</p>
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-[#003a8c]"
                >
                  {t("request.supportCta")}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Phones: the form sits below the fold, so keep a shortcut to it in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">
        <a
          href="#request"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c]"
        >
          {t("request.title")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
