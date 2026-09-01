import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, FileText } from "lucide-react";
import { ProfileCard } from "./profile-card";
import { VERIFICATION_TIER } from "@/constants/status";
import type { CompanyProfileData } from "./types";

const EMPTY = "—";

// Fixed area rows. The last (companyDocuments) is a lighter "Documents Reviewed"
// status rather than a full verification.
const AREA_ROWS = [
  { key: "businessRegistration", reviewedOnly: false },
  { key: "taxCompliance", reviewedOnly: false },
  { key: "physicalAddress", reviewedOnly: false },
  { key: "bankReference", reviewedOnly: false },
  { key: "companyDocuments", reviewedOnly: true },
] as const;

interface VerificationTableProps {
  company: CompanyProfileData;
}

/**
 * On-page Verification Summary table (design 5, bottom-left). Statuses reflect
 * the verification tier; the "Verified By" column is always the portal
 * ("Trade in DRC"). Dates use `verified_at`, falling back to `updated_at`, then
 * "—" — never fabricated.
 */
export function VerificationTable({ company }: VerificationTableProps) {
  const t = useTranslations("CompanyProfile");
  const locale = useLocale();

  const isVerified =
    company.verification_tier === VERIFICATION_TIER.VERIFIED ||
    company.verification_tier === VERIFICATION_TIER.PREMIUM;

  const rawDate = company.verified_at ?? company.updated_at;
  const dateVerified = rawDate
    ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(
        new Date(rawDate),
      )
    : EMPTY;

  return (
    <ProfileCard
      id="verification"
      title={t("verification.title")}
      action={
        isVerified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("verification.overall")}
          </span>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-market-navy/10 bg-market-navy/5 text-left text-[11px] uppercase tracking-wide text-market-navy/60">
              <th className="px-3 py-2 font-semibold">{t("verification.area")}</th>
              <th className="px-3 py-2 font-semibold">{t("verification.status")}</th>
              <th className="px-3 py-2 font-semibold">{t("verification.verifiedBy")}</th>
              <th className="px-3 py-2 font-semibold">{t("verification.dateVerified")}</th>
            </tr>
          </thead>
          <tbody>
            {AREA_ROWS.map(({ key, reviewedOnly }) => (
              <tr key={key} className="border-b border-market-navy/5 last:border-0">
                <td className="px-3 py-2.5 text-market-navy/80">{t(`verification.areas.${key}`)}</td>
                <td className="px-3 py-2.5">
                  {reviewedOnly ? (
                    <span className="inline-flex items-center gap-1 text-market-navy/70">
                      <FileText className="h-3.5 w-3.5 text-market-navy/50" />
                      {t("verification.statusReviewed")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("verification.statusVerified")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-market-navy/70">{t("verification.verifiedByValue")}</td>
                <td className="px-3 py-2.5 text-market-navy/70">{dateVerified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProfileCard>
  );
}
