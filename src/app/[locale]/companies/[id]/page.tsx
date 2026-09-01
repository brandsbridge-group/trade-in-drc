"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track-event";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import type { Locale } from "@/config/locales";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { COMPANY_STATUS } from "@/constants/status";
import type { VerificationTier } from "@/lib/trust/types";
import type { ContactVisibility } from "@/lib/supabase/types";
import type { CompanyProfileData, ProfileProduct, ProfileSector } from "@/components/companies/market/profile/types";
import { FunnelStepper } from "@/components/companies/market/profile/funnel-stepper";
import { ProfileHero } from "@/components/companies/market/profile/profile-hero";
import { ProfileTabs } from "@/components/companies/market/profile/profile-tabs";
import { OverviewAbout } from "@/components/companies/market/profile/overview-about";
import { OverviewProducts } from "@/components/companies/market/profile/overview-products";
import { PartnershipSnapshot } from "@/components/companies/market/profile/partnership-snapshot";
import { VerificationTable } from "@/components/companies/market/profile/verification-table";
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
 * PII-safe public company profile (customer design 5).
 *
 * The base `companies` table carries contact_email / contact_phone. Those are
 * NEVER shipped to an anonymous browser. The public payload is read from the
 * `companies_public` view (00012) which excludes contact PII entirely, plus the
 * verified-readable rich-profile columns. The only contact path on this page is
 * the one-way "Request Contact / Introduction" lead form, which writes to
 * `business_requests` server-side and never reveals the company's contact data.
 */
function useCompanyProfile(id: string) {
  return useQuery({
    queryKey: ["company-profile", id],
    queryFn: async (): Promise<CompanyProfileData> => {
      const supabase = createClient();

      const { data: pub, error: pubError } = await supabase
        .from("companies_public")
        .select(
          "id, owner_id, name, description, city, province, country, website, logo_url, contact_visibility, sector_id",
        )
        .eq("id", id)
        .single();
      if (pubError) throw pubError;
      if (!pub?.id) throw new Error("not_found");

      // Verified-readable rich-profile columns (no contact PII selected here).
      const { data: rich } = await supabase
        .from("companies")
        .select(
          "verification_tier, is_premium, premium_plan, production_capacity, moq, lead_time, certifications, markets, spoken_languages, verification_summary, verified_at, updated_at",
        )
        .eq("id", id)
        .eq("status", COMPANY_STATUS.VERIFIED)
        .single();

      const [productsRes, sectorRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, name_en, name_fr, description, images")
          .eq("company_id", id)
          .order("created_at", { ascending: false }),
        pub.sector_id
          ? supabase
              .from("sectors")
              .select("id, name_en, name_fr, name_tr, name_zh, name_es")
              .eq("id", pub.sector_id)
              .single()
          : Promise.resolve({ data: null }),
      ]);

      return {
        id: pub.id,
        owner_id: pub.owner_id!,
        name: pub.name ?? "",
        description: pub.description,
        city: pub.city,
        province: pub.province,
        country: pub.country,
        website: pub.website,
        logo_url: pub.logo_url,
        contact_visibility: (pub.contact_visibility ?? "login_required") as ContactVisibility,
        verification_tier: (rich?.verification_tier ?? "verified") as VerificationTier,
        is_premium: Boolean(rich?.is_premium),
        premium_plan: rich?.premium_plan ?? null,
        production_capacity: rich?.production_capacity ?? null,
        moq: rich?.moq ?? null,
        lead_time: rich?.lead_time ?? null,
        certifications: rich?.certifications ?? [],
        markets: rich?.markets ?? [],
        spoken_languages: rich?.spoken_languages ?? [],
        verified_at: rich?.verified_at ?? null,
        updated_at: rich?.updated_at ?? null,
        verification_summary: rich?.verification_summary ?? null,
        sector: (sectorRes.data as ProfileSector | null) ?? null,
        products: (productsRes.data ?? []) as unknown as ProfileProduct[],
      };
    },
    enabled: !!id,
  });
}

export default function CompanyProfilePage() {
  const params = useParams();
  const companyId = params.id as string;
  const t = useTranslations("CompanyProfile");
  const tMarketplace = useTranslations("Marketplace");
  const locale = useLocale();
  const { data: company, isLoading, error } = useCompanyProfile(companyId);

  useEffect(() => {
    if (companyId) {
      trackEvent("company", companyId, "view");
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

  const sectorLabel = company.sector
    ? pickLocalized(company.sector, "name", locale as Locale)
    : null;
  const subtitle = sectorLabel ? `${sectorLabel} ${t("hero.subtitleSuffix")}` : null;

  const localizedProducts: ProfileProduct[] = company.products.map((p) => {
    const row = p as unknown as DbProductRow;
    return {
      id: row.id,
      name: (locale === "fr" ? row.name_fr : row.name_en) ?? row.name_en ?? row.name,
      description: row.description,
      images: row.images,
    };
  });

  const scrollToContact = () => {
    const el = document.getElementById("contact-intro");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-market-cream/30">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <FunnelStepper />
        <ProfileHero company={company} subtitle={subtitle} onRequestIntro={scrollToContact} />
        <ProfileTabs />

        {/* 3-column content row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr_0.9fr]">
          <OverviewAbout company={company} />
          <OverviewProducts products={localizedProducts} />
          <PartnershipSnapshot sectorLabel={sectorLabel} certifications={company.certifications} />
        </div>

        {/* Verification + contact row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <VerificationTable company={company} />
          <ContactIntroForm companyId={company.id} companyName={company.name} />
        </div>
      </div>
    </div>
  );
}
