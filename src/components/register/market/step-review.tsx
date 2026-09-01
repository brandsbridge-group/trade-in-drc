"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ClipboardCheck } from "lucide-react";
import type { PlanId } from "./constants";
import { isInternational, type RegisterFormData, type SectorOption } from "./types";
import { SectionHeader } from "./field-kit";

interface Props {
  data: RegisterFormData;
  plan: PlanId;
  sectors: SectorOption[];
  /** P2-2: jump back to the "plan" step. Same ghost-affordance pattern as
   *  the wizard's own "Change" button for the profile-type gate
   *  (register-wizard.tsx's `profileChooser.change` ghost) — a compact
   *  text link rather than a new visual language. */
  onChangePlan: () => void;
}

function Row({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  /** Optional trailing slot rendered next to the value (e.g. a "Change" link). */
  action?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-right font-medium text-slate-800">{value}</span>
        {action}
      </span>
    </div>
  );
}

/** Step 5 — Review & Submit: read-only summary of the entered data. */
export function StepReview({ data, plan, sectors, onChangePlan }: Props) {
  const t = useTranslations("RegisterCompany");
  const international = isInternational(data);
  const home = !international;
  const sectorLabel =
    sectors.find((s) => s.id === data.sectorId)?.label ?? data.sectorId;
  const languages = data.languages.map((l) => t(`languages.${l}`)).join(", ");
  const interests = data.interests.map((i) => t(`interests.${i}`)).join(", ");

  return (
    <div>
      <SectionHeader icon={ClipboardCheck} title={t("sections.review")} />
      <p className="mb-4 text-xs text-slate-500">{t("review.hint")}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-market-navy">
            {t("sections.legal")}
          </h3>
          {/* The two paths sell different packages under the same PlanId:
              `tiers.*` is the Congolese ladder (Premium Local Partner, USD
              3,000) while `intl.plan.*` is the international one (Premium
              International Profile, USD 3,600). Naming the wrong one on the
              final confirmation screen would misrepresent the price. */}
          <Row
            label={t("review.plan")}
            value={
              international
                ? t(`intl.plan.${plan === "premium" ? "premium" : "free"}.name`)
                : t(`tiers.${plan}.name`)
            }
            action={
              // P2-2: Review had no way back to the plan step — the same
              // compact ghost-link pattern used for profileChooser.change,
              // scoped to this one row instead of the whole page.
              <button
                type="button"
                onClick={onChangePlan}
                data-testid="review-change-plan"
                className="inline-flex h-6 items-center gap-0.5 rounded-[0.5rem] px-1.5 text-xs font-semibold text-market-navy transition-colors duration-150 hover:bg-slate-100"
              >
                <ChevronLeft className="size-3" aria-hidden />
                {t("review.changePlan")}
              </button>
            }
          />
          <Row label={t("fields.country")} value={data.country} />
          <Row label={t("fields.companyLegalName")} value={data.companyLegalName} />
          <Row label={t("fields.tradingName")} value={data.tradingName} />
          <Row
            label={home ? t("fields.rccmNumber") : t("fields.registrationNumber")}
            value={data.rccmNumber}
          />
          <Row
            label={home ? t("fields.nationalId") : t("fields.nationalIdIntl")}
            value={data.nationalId}
          />
          <Row label={home ? t("fields.nif") : t("fields.taxIdIntl")} value={data.nif} />
          <Row label={t("fields.yearEstablished")} value={data.yearEstablished} />
          <Row
            label={t("fields.legalForm")}
            value={data.legalForm ? t(`legalForms.${data.legalForm}`) : ""}
          />
          <Row
            label={t("fields.employees")}
            value={data.employees ? t(`employeeRanges.${data.employees}`) : ""}
          />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-market-navy">
            {t("sections.professional")}
          </h3>
          <Row label={t("fields.sector")} value={sectorLabel} />
          <Row label={t("fields.productsServices")} value={data.productsServices} />
          <Row
            label={home ? t("fields.province") : t("fields.region")}
            value={data.province}
          />
          <Row label={t("fields.city")} value={data.city} />
          <Row label={t("fields.website")} value={data.website} />
          <Row label={t("fields.officialEmail")} value={data.officialEmail} />
          <Row
            label={t("fields.phone")}
            value={data.phone ? `${data.dialCode} ${data.phone}` : ""}
          />

          {/* Steps 2–3 of the international form are otherwise absent from the
              summary the applicant is asked to confirm. */}
          {international && (
            <>
              <Row label={t("intl.fields.headOffice")} value={data.headOffice} />
              <Row
                label={t("intl.fields.annualTurnover")}
                value={
                  data.annualTurnover
                    ? t(`intl.turnoverRanges.${data.annualTurnover}`)
                    : ""
                }
              />
              <Row label={t("intl.fields.currentMarkets")} value={data.currentMarkets} />
              <Row label={t("intl.fields.certifications")} value={data.certifications} />
              <Row
                label={t("intl.fields.drcInterests")}
                value={data.drcInterests
                  .map((i) => t(`intl.drcInterests.${i}`))
                  .join(", ")}
              />
              <Row
                label={t("intl.fields.targetProvinces")}
                value={data.targetProvinces.join(", ")}
              />
              <Row
                label={t("intl.fields.entryTimeline")}
                value={
                  data.entryTimeline ? t(`intl.entryTimelines.${data.entryTimeline}`) : ""
                }
              />
              <Row
                label={t("intl.fields.marketInterestNotes")}
                value={data.marketInterestNotes}
              />
            </>
          )}

          <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-market-navy">
            {t("sections.positioning")}
          </h3>
          <Row label={t("fields.contactPerson")} value={data.contactPerson} />
          <Row label={t("fields.jobTitle")} value={data.jobTitle} />
          <Row label={t("fields.languages")} value={languages} />
          <Row label={t("fields.interests")} value={interests} />

          <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-market-navy">
            {t("sections.documents")}
          </h3>
          <Row label={t("fields.rccmCertificate")} value={data.rccmCertName} />
          <Row label={t("fields.nifDocument")} value={data.nifDocName} />
          <Row label={t("fields.companyLogo")} value={data.logoName} />
        </div>
      </div>
    </div>
  );
}
