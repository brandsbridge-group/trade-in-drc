"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { COMPANY_STATUS } from "@/constants/status";
import type { VerificationTier } from "@/lib/trust/types";
import type { ContactVisibility } from "@/lib/supabase/types";
import type { CompanyProfileData, ProfileFacts, ProfileLabel, ProfileMedia, ProfileProduct, ProfileSector } from "./types";

const LABEL_COLUMNS = "id, name_en, name_fr, name_tr, name_zh, name_es";

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

/** Shape the `company_public_facts` JSON (00061); anything unexpected reads as "not provided". */
export function toProfileFacts(raw: unknown): ProfileFacts {
  const facts = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    tradingName: text(facts.trading_name),
    yearEstablished: text(facts.year_established),
    legalForm: text(facts.legal_form),
    employees: text(facts.employees),
  };
}

/**
 * Everything the public company page shows, in one query.
 *
 * PII-safe: the identity comes from the `companies_public` view (00012), which
 * has no contact columns, and the registration facts from `company_public_facts`
 * (00061) — never from `verification_summary`, which also holds legal
 * identifiers and the contact person. The only contact path on the page is the
 * one-way request form.
 */
export function useCompanyProfile(id: string) {
  return useQuery({
    queryKey: ["company-profile", id],
    queryFn: async (): Promise<CompanyProfileData> => {
      const supabase = createClient();

      const { data: pub, error: pubError } = await supabase
        .from("companies_public")
        .select("id, owner_id, name, description, address, city, province, country, website, logo_url, contact_visibility, sector_id, created_at")
        .eq("id", id)
        .single();
      if (pubError) throw pubError;
      if (!pub?.id) throw new Error("not_found");

      const [richRes, factsRes, productsRes, sectorRes, mediaRes, tagsRes, hsRes] = await Promise.all([
        supabase
          .from("companies")
          .select("verification_tier, is_premium, production_capacity, moq, lead_time, certifications, markets, spoken_languages, verified_at")
          .eq("id", id)
          .eq("status", COMPANY_STATUS.VERIFIED)
          .maybeSingle(),
        supabase.rpc("company_public_facts", { p_company_id: id }),
        supabase
          .from("products")
          .select("id, name, name_en, name_fr, description, images")
          .eq("company_id", id)
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
        pub.sector_id
          ? supabase.from("sectors").select(LABEL_COLUMNS).eq("id", pub.sector_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("company_media")
          .select("id, kind, url, title_en, title_fr")
          .eq("company_id", id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase.from("company_tags").select(`tags(${LABEL_COLUMNS})`).eq("company_id", id),
        supabase.from("company_hs_codes").select(`hs_codes(code, ${LABEL_COLUMNS})`).eq("company_id", id),
      ]);

      const rich = richRes.data;
      const tags = ((tagsRes.data ?? []) as unknown as { tags: ProfileLabel | null }[])
        .map((row) => row.tags)
        .filter((tag): tag is ProfileLabel => Boolean(tag));
      const hsCodes = ((hsRes.data ?? []) as unknown as { hs_codes: ProfileLabel | null }[])
        .map((row) => row.hs_codes)
        .filter((code): code is ProfileLabel => Boolean(code))
        .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));

      return {
        id: pub.id,
        owner_id: pub.owner_id!,
        name: pub.name ?? "",
        description: pub.description,
        address: pub.address,
        city: pub.city,
        province: pub.province,
        country: pub.country,
        website: pub.website,
        logo_url: pub.logo_url,
        created_at: pub.created_at,
        contact_visibility: (pub.contact_visibility ?? "login_required") as ContactVisibility,
        verification_tier: (rich?.verification_tier ?? "verified") as VerificationTier,
        is_premium: Boolean(rich?.is_premium),
        production_capacity: rich?.production_capacity ?? null,
        moq: rich?.moq ?? null,
        lead_time: rich?.lead_time ?? null,
        certifications: rich?.certifications ?? [],
        markets: rich?.markets ?? [],
        spoken_languages: rich?.spoken_languages ?? [],
        verified_at: rich?.verified_at ?? null,
        facts: toProfileFacts(factsRes.data),
        sector: (sectorRes.data as ProfileSector | null) ?? null,
        tags,
        hsCodes,
        media: (mediaRes.data ?? []) as unknown as ProfileMedia[],
        products: (productsRes.data ?? []) as unknown as ProfileProduct[],
      };
    },
    enabled: !!id,
  });
}
