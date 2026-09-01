"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { VerificationBadge } from "@/components/trust/verification-badge";
import { Building2, ExternalLink, Handshake } from "lucide-react";
import type { VerificationTier } from "@/lib/trust/types";

/**
 * Verified References network (Req 15). A company vouches for partners it has
 * worked with. RLS on `company_references` (00019) only returns APPROVED
 * references whose trust-link is renderable: off-platform references are always
 * shown when approved; on-platform references appear only when the referenced
 * company is itself a verified company. We render a trust-link to that profile
 * ONLY for the on-platform verified case — the visible network of trust.
 */

interface ReferencedCompany {
  id: string;
  name: string;
  verification_tier: VerificationTier | null;
  status: string;
}

interface ReferenceRow {
  id: string;
  referenced_company_id: string | null;
  referenced_name: string | null;
  relationship: string | null;
  note_en: string | null;
  note_fr: string | null;
  referenced: ReferencedCompany | null;
}

function useReferences(companyId: string) {
  return useQuery({
    queryKey: ["company-references", companyId],
    queryFn: async (): Promise<ReferenceRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("company_references")
        .select("id, referenced_company_id, referenced_name, relationship, note_en, note_fr")
        .eq("company_id", companyId)
        .eq("status", "approved");
      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }
      const refs = (data ?? []) as Array<Omit<ReferenceRow, "referenced">>;

      // Resolve on-platform referenced companies in one round trip. RLS keeps
      // this to verified companies only, which is exactly the trust-link set.
      const refCompanyIds = Array.from(
        new Set(refs.map((r) => r.referenced_company_id).filter((id): id is string => Boolean(id))),
      );
      const byId = new Map<string, ReferencedCompany>();
      if (refCompanyIds.length > 0) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name, verification_tier, status")
          .in("id", refCompanyIds)
          .eq("status", "verified");
        for (const c of (companies ?? []) as ReferencedCompany[]) byId.set(c.id, c);
      }

      return refs.map((r) => ({
        ...r,
        referenced: r.referenced_company_id ? byId.get(r.referenced_company_id) ?? null : null,
      }));
    },
    enabled: !!companyId,
  });
}

export function CompanyReferences({ companyId }: { companyId: string }) {
  const t = useTranslations("Marketplace.references");
  const locale = useLocale();
  const { data: references = [], isLoading, error } = useReferences(companyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{t("error")}</p>;
  }

  if (references.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="space-y-3">
      {references.map((ref) => {
        // Trust-link is shown only when the referenced company is on-platform
        // AND itself verified. RLS already filters out non-renderable rows, but
        // we guard here too so an off-platform reference never links anywhere.
        const isTrustedLink = Boolean(
          ref.referenced && ref.referenced.status === "verified",
        );
        const displayName = ref.referenced?.name ?? ref.referenced_name ?? t("unnamedPartner");
        const note = locale === "fr" ? ref.note_fr : ref.note_en;

        return (
          <div key={ref.id} className="bg-card border rounded-md p-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Handshake className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isTrustedLink && ref.referenced ? (
                    <Link
                      href={`/companies/${ref.referenced.id}`}
                      className="text-sm font-medium inline-flex items-center gap-1 text-primary hover:underline transition"
                    >
                      {displayName}
                      <ExternalLink className="w-3 h-3" aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-sm font-medium inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-muted-foreground" aria-hidden />
                      {displayName}
                    </span>
                  )}
                  {isTrustedLink && ref.referenced && (
                    <VerificationBadge
                      tier={ref.referenced.verification_tier ?? "verified"}
                    />
                  )}
                </div>
                {ref.relationship && (
                  <p className="text-xs text-muted-foreground mt-0.5">{ref.relationship}</p>
                )}
                {note && <p className="text-xs text-foreground/80 mt-1 line-clamp-3">{note}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
