"use client";

import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, Package, Send } from "lucide-react";
import { Link } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { toDisplayHost, toExternalHref } from "@/lib/url/external-href";
import type { Locale } from "@/config/locales";
import { ProfileCard } from "./profile-card";
import type { CompanyProfileData, ProfileProduct } from "./types";

const EYEBROW = "text-[11px] font-semibold uppercase tracking-wider text-slate-400";
const CHIP = "rounded-full bg-slate-100 px-3 py-1 text-[12.5px] font-medium text-slate-700";

/** The company's own presentation and the specialities (tags) it picked. */
export function ProfileAbout({ company, locale }: { company: CompanyProfileData; locale: string }) {
  const t = useTranslations("CompanyProfile.page.about");
  return (
    <ProfileCard id="about" title={t("title")}>
      <p className={company.description ? "whitespace-pre-line text-[15px] leading-relaxed text-slate-700" : "text-sm text-slate-400"}>
        {company.description || t("empty")}
      </p>
      {company.tags.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className={EYEBROW}>{t("tags")}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {company.tags.map((tag) => (
              <li key={tag.id} className={CHIP}>
                {pickLocalized(tag, "name", locale as Locale)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProfileCard>
  );
}

/** Published products, each linking to its public page. Renders nothing when there are none. */
export function ProfileProducts({ products }: { products: ProfileProduct[] }) {
  const t = useTranslations("CompanyProfile.page.products");
  if (products.length === 0) return null;
  return (
    <ProfileCard
      id="products"
      title={t("title")}
      action={<span className="text-xs font-medium text-slate-500">{t("count", { count: products.length })}</span>}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.id}`}
              className="group block h-full overflow-hidden rounded-xl ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-navy"
            >
              <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-slate-100">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded photo on Supabase storage
                  <img src={product.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-slate-300" aria-hidden />
                )}
              </div>
              <div className="p-3">
                <p className="flex items-start justify-between gap-2 text-[13.5px] font-semibold text-market-navy">
                  <span className="line-clamp-2 min-w-0">{product.name}</span>
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-market-navy" aria-hidden />
                </p>
                {product.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{product.description}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

/**
 * What the company filled in under "Commerce" in its dashboard: capacity,
 * minimum order, lead time, markets, languages, certifications and HS codes.
 * Only what was filled in is shown; the whole card disappears when nothing was.
 */
export function ProfileTrade({ company, locale }: { company: CompanyProfileData; locale: string }) {
  const t = useTranslations("CompanyProfile.page.trade");

  const figures = [
    { label: t("capacity"), value: company.production_capacity },
    { label: t("moq"), value: company.moq },
    { label: t("leadTime"), value: company.lead_time },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value?.trim()));

  const groups = [
    { label: t("markets"), values: company.markets },
    { label: t("languages"), values: company.spoken_languages },
    { label: t("certifications"), values: company.certifications },
  ].filter((group) => group.values.length > 0);

  if (figures.length === 0 && groups.length === 0 && company.hsCodes.length === 0) return null;

  return (
    <ProfileCard id="trade" title={t("title")}>
      {figures.length > 0 && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {figures.map((row) => (
            <div key={row.label} className="rounded-xl bg-slate-50 p-4">
              <dt className={EYEBROW}>{row.label}</dt>
              <dd className="mt-1 break-words text-[15px] font-semibold text-market-navy">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {groups.map((group, index) => (
        <div key={group.label} className={index > 0 || figures.length > 0 ? "mt-4" : undefined}>
          <p className={EYEBROW}>{group.label}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {group.values.map((value) => (
              <li key={value} className={CHIP}>{value}</li>
            ))}
          </ul>
        </div>
      ))}
      {company.hsCodes.length > 0 && (
        <div className={figures.length > 0 || groups.length > 0 ? "mt-4" : undefined}>
          <p className={EYEBROW}>{t("hsCodes")}</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {company.hsCodes.map((code) => (
              <li key={code.id} className="flex items-baseline gap-3 py-2 text-[13px]">
                <span className="shrink-0 rounded-md bg-market-cream px-2 py-0.5 font-mono text-xs font-semibold text-market-navy">{code.code}</span>
                <span className="min-w-0 text-slate-600">{pickLocalized(code, "name", locale as Locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ProfileCard>
  );
}

/** Side card: the identity facts, one labelled row each, skipping what is empty. */
export function ProfileFactsCard({
  company,
  sectorLabel,
  legalFormLabel,
  employeesLabel,
}: {
  company: CompanyProfileData;
  sectorLabel: string | null;
  legalFormLabel: string | null;
  employeesLabel: string | null;
}) {
  const t = useTranslations("CompanyProfile.page.facts");
  const websiteHref = toExternalHref(company.website);
  const location = [company.city, company.province, company.country].filter(Boolean).join(", ");
  const memberSince = company.created_at ? String(new Date(company.created_at).getFullYear()) : null;

  const rows: { label: string; value: ReactNode }[] = [
    { label: t("sector"), value: sectorLabel },
    { label: t("legalForm"), value: legalFormLabel },
    { label: t("founded"), value: company.facts.yearEstablished },
    { label: t("employees"), value: employeesLabel },
    { label: t("location"), value: location || null },
    { label: t("address"), value: company.address?.trim() || null },
    {
      label: t("website"),
      value: websiteHref ? (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1 break-all underline-offset-2 transition-colors hover:text-market-or-dark hover:underline"
        >
          {toDisplayHost(company.website)}
          <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
        </a>
      ) : null,
    },
    { label: t("memberSince"), value: memberSince },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <ProfileCard title={t("title")}>
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 text-[13px] first:pt-0 last:pb-0">
            <dt className="shrink-0 text-slate-500">{row.label}</dt>
            <dd className="min-w-0 text-right font-medium text-market-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </ProfileCard>
  );
}

/**
 * Side card: what "verified" means here. It states only what the team really
 * does — review the legal identity and registration documents — and the date
 * of the decision; no per-area checklist is claimed.
 */
export function ProfileTrustCard({ verifiedAt }: { verifiedAt: string | null }) {
  const t = useTranslations("CompanyProfile.page.trust");
  const format = useFormatter();
  return (
    <ProfileCard id="verification" title={t("title")}>
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-emerald-700" aria-hidden>
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-emerald-900">
            {verifiedAt
              ? t("verifiedOn", { date: format.dateTime(new Date(verifiedAt), { day: "numeric", month: "long", year: "numeric" }) })
              : t("verifiedNoDate")}
          </p>
          <p className="text-xs text-emerald-800">{t("by")}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {[t("point1"), t("point2")].map((point) => (
          <li key={point} className="flex items-start gap-2 text-[13px] text-slate-600">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}

/** Side card: the navy call to action that scrolls to the request form. */
export function ProfileContactCta({ companyName, onRequestContact }: { companyName: string; onRequestContact: () => void }) {
  const t = useTranslations("CompanyProfile.page");
  return (
    <section className="relative overflow-hidden rounded-2xl bg-market-navy p-5 text-white sm:p-6">
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-market-or/25 blur-3xl" aria-hidden />
      <h2 className="relative font-display text-lg font-semibold">{t("cta.title", { name: companyName })}</h2>
      <p className="relative mt-1 text-[13px] text-white/75">{t("cta.body")}</p>
      <button
        type="button"
        onClick={onRequestContact}
        className="relative mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-market-or px-4 py-2.5 text-sm font-semibold text-market-navy transition-colors hover:bg-market-or-light"
      >
        <Send className="h-4 w-4" aria-hidden />
        {t("requestContact")}
      </button>
    </section>
  );
}
