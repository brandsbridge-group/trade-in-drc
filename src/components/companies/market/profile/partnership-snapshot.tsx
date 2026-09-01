import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { ProfileCard } from "./profile-card";

const EMPTY = "—";

const INTEREST_KEYS = [
  "distributorship",
  "oem",
  "technologyTransfer",
  "jointVentures",
  "supplierPartnerships",
] as const;

interface PartnershipSnapshotProps {
  sectorLabel: string | null;
  certifications: string[];
}

/**
 * Design-5 right rail: "Partnership Interests" static green-check list +
 * "Company Snapshot" key-value table. Registry identifiers (DUNS, Tax ID/RCCM)
 * are not in the schema, so they render "—"; industry sector and quality
 * certifications use real data.
 */
export function PartnershipSnapshot({ sectorLabel, certifications }: PartnershipSnapshotProps) {
  const t = useTranslations("CompanyProfile");

  const rows: { label: string; value: string }[] = [
    { label: t("snapshot.duns"), value: EMPTY },
    { label: t("snapshot.taxId"), value: EMPTY },
    { label: t("snapshot.industrySector"), value: sectorLabel ?? EMPTY },
    { label: t("snapshot.businessRegistrations"), value: t("snapshot.businessRegistrationsValue") },
    {
      label: t("snapshot.qualityCertifications"),
      value: certifications.length > 0 ? certifications.join(", ") : EMPTY,
    },
  ];

  return (
    <div className="space-y-4">
      <ProfileCard id="partnership" title={t("partnership.title")}>
        <ul className="space-y-2.5">
          {INTEREST_KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2 text-[13px] text-market-navy/80">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              {t(`partnership.${key}`)}
            </li>
          ))}
        </ul>
      </ProfileCard>

      <ProfileCard title={t("snapshot.title")}>
        <dl className="divide-y divide-market-navy/10">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 py-2 text-[13px]">
              <dt className="text-market-navy/55">{row.label}</dt>
              <dd className="text-right font-medium text-market-navy/85">{row.value}</dd>
            </div>
          ))}
        </dl>
      </ProfileCard>
    </div>
  );
}
