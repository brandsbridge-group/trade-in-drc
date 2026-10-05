"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { trackView } from "@/lib/analytics/track-view";
import { Link } from "@/i18n/routing";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { ProfileProduct } from "@/components/companies/market/profile/types";
import { useCompanyProfile } from "@/components/companies/market/profile/profile-data";
import { ProfileHero, type HeroStat } from "@/components/companies/market/profile/profile-hero";
import { ProfileGallery } from "@/components/companies/market/profile/profile-gallery";
import {
  ProfileAbout,
  ProfileContactCta,
  ProfileFactsCard,
  ProfileProducts,
  ProfileTrade,
  ProfileTrustCard,
} from "@/components/companies/market/profile/profile-sections";
import { ContactIntroForm } from "@/components/companies/market/profile/contact-intro-form";

interface DbProductRow {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  description: string | null;
  images: string[] | null;
}

/**
 * Public company page. Everything shown is what the company entered — its
 * presentation, registration facts, trade capabilities, photos and products —
 * plus the verification decision. Sections with nothing to show are left out.
 * Data and the PII rules live in `useCompanyProfile`.
 */
export default function CompanyProfilePage() {
  const params = useParams();
  const companyId = params.id as string;
  const t = useTranslations("CompanyProfile.page");
  const tForm = useTranslations("RegisterCompany");
  const tMarketplace = useTranslations("Marketplace");
  const locale = useLocale();
  const { data: company, isLoading, error } = useCompanyProfile(companyId);

  useEffect(() => {
    if (companyId) {
      trackView("company", companyId);
    }
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-market-cream/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-market-navy border-t-transparent" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-market-cream/30">
        <div className="text-center">
          <Building2 className="mx-auto mb-3 h-12 w-12 text-market-navy/40" />
          <h1 className="mb-1 text-xl font-bold text-market-navy">{tMarketplace("profile.notFoundTitle")}</h1>
          <p className="mb-4 text-sm text-market-navy/60">{tMarketplace("profile.notFoundBody")}</p>
          <Button asChild size="sm">
            <Link href="/companies">{tMarketplace("profile.backToDirectory")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sectorLabel = company.sector ? pickLocalized(company.sector, "name", locale as Locale) : null;
  // Stored as form keys ("sa", "1-10"); an unknown key is shown as typed.
  const { legalForm, employees, yearEstablished } = company.facts;
  const legalFormLabel = legalForm && tForm.has(`legalForms.${legalForm}`) ? tForm(`legalForms.${legalForm}`) : legalForm;
  const employeesLabel = employees && tForm.has(`employeeRanges.${employees}`) ? tForm(`employeeRanges.${employees}`) : employees;

  const products: ProfileProduct[] = company.products.map((p) => {
    const row = p as unknown as DbProductRow;
    return {
      id: row.id,
      name: (locale === "fr" ? row.name_fr : row.name_en) ?? row.name_en ?? row.name,
      description: row.description,
      images: row.images,
    };
  });

  const photos = company.media.filter((m) => m.kind === "gallery");
  const hasMedia = company.media.length > 0;
  const hasTrade =
    Boolean(company.production_capacity || company.moq || company.lead_time) ||
    company.markets.length + company.spoken_languages.length + company.certifications.length + company.hsCodes.length > 0;

  const stats: HeroStat[] = [
    { label: t("stats.founded"), value: yearEstablished },
    { label: t("stats.employees"), value: employeesLabel },
    { label: t("stats.products"), value: products.length > 0 ? String(products.length) : null },
    { label: t("stats.markets"), value: company.markets.length > 0 ? String(company.markets.length) : null },
  ].filter((stat): stat is HeroStat => Boolean(stat.value));

  const sections = [
    { id: "about", label: t("nav.about"), show: true },
    { id: "gallery", label: t("nav.gallery"), show: hasMedia },
    { id: "products", label: t("nav.products"), show: products.length > 0 },
    { id: "trade", label: t("nav.trade"), show: hasTrade },
    { id: "verification", label: t("nav.verification"), show: true },
    { id: "contact-intro", label: t("nav.contact"), show: true },
  ].filter((section) => section.show);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  const scrollToContact = () => scrollTo("contact-intro");

  return (
    <div data-page-end="flush" className="min-h-screen bg-market-cream/30">
      <div className="mx-auto max-w-6xl space-y-4 px-4 pb-14 pt-6">
        <ProfileHero
          company={company}
          sectorLabel={sectorLabel}
          coverUrl={photos[0]?.url ?? null}
          stats={stats}
          onRequestContact={scrollToContact}
        />

        <nav aria-label={t("nav.label")} className="-mx-4 overflow-x-auto px-4">
          <ul className="flex w-max gap-1.5">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(section.id)}
                  className="whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-slate-600 ring-1 ring-slate-200/70 transition-colors hover:bg-market-navy hover:text-white"
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-8">
            <ProfileAbout company={company} locale={locale} />
            <ProfileGallery companyName={company.name} media={company.media} locale={locale} />
            <ProfileProducts products={products} />
            <ProfileTrade company={company} locale={locale} />
            <ContactIntroForm companyId={company.id} companyName={company.name} />
          </div>

          <aside className="min-w-0 space-y-4 lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-20">
              <ProfileContactCta companyName={company.name} onRequestContact={scrollToContact} />
              <ProfileFactsCard company={company} sectorLabel={sectorLabel} legalFormLabel={legalFormLabel} employeesLabel={employeesLabel} />
              <ProfileTrustCard verifiedAt={company.verified_at} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
