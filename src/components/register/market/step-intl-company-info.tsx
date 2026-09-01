"use client";

import { useTranslations } from "next-intl";
import { Landmark } from "lucide-react";
import { COUNTRIES, COUNTRY_DIAL_CODE, DIAL_CODES } from "@/config/geo";
import { LEGAL_FORMS, YEAR_OPTIONS } from "./constants";
import type { RegisterFormData } from "./types";
import { SectionHeader, TextField, SelectField, PhoneField } from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
}

/**
 * International step 1 — Company Identification.
 * Field list is specified exactly by the customer design
 * (latest-designs/2026-07-28/register-international-company.ai).
 */
export function StepIntlCompanyInfo({ data, update, errors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);

  const onCountryChange = (country: string) => {
    const dial = COUNTRY_DIAL_CODE[country];
    update(dial ? { country, dialCode: dial } : { country });
  };

  return (
    <div>
      <SectionHeader icon={Landmark} title={t("intl.sections.companyInfo")} />
      {/* P2-4: this step always shares the viewport with the premium sidebar
          (register-wizard.tsx grid), so the form only ever gets ~2.6/3.6 of
          the page width — sizing columns off the container (not the
          viewport) is what keeps cells wide enough for FR labels at desktop
          widths. 10 single-width fields + 1 two-span (headOffice) below =
          exactly three full 4-track rows at @4xl, no orphaned cells. */}
      <div className="@container">
        <div className="grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
        <TextField
          label={t("fields.companyLegalName")}
          required
          value={data.companyLegalName}
          onChange={(v) => update({ companyLegalName: v })}
          placeholder={t("ph.companyLegalName")}
          invalid={has("companyLegalName")}
        />
        <TextField
          label={t("intl.fields.tradingName")}
          value={data.tradingName}
          onChange={(v) => update({ tradingName: v })}
          placeholder={t("intl.ph.tradingName")}
        />
        <SelectField
          label={t("fields.country")}
          required
          value={data.country}
          onChange={onCountryChange}
          placeholder={t("ph.country")}
          options={COUNTRIES.map((c) => ({ value: c, label: c }))}
          invalid={has("country")}
        />
        <TextField
          label={t("fields.registrationNumber")}
          required
          value={data.rccmNumber}
          onChange={(v) => update({ rccmNumber: v })}
          placeholder={t("ph.registrationNumber")}
          invalid={has("rccmNumber")}
        />

        <TextField
          label={t("fields.taxIdIntl")}
          value={data.nif}
          onChange={(v) => update({ nif: v })}
          placeholder={t("intl.ph.taxId")}
        />
        <SelectField
          label={t("fields.yearEstablished")}
          required
          value={data.yearEstablished}
          onChange={(v) => update({ yearEstablished: v })}
          placeholder={t("ph.yearEstablished")}
          options={YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
          invalid={has("yearEstablished")}
        />
        <SelectField
          label={t("fields.legalForm")}
          required
          value={data.legalForm}
          onChange={(v) => update({ legalForm: v })}
          placeholder={t("ph.legalForm")}
          options={LEGAL_FORMS.map((f) => ({ value: f, label: t(`legalForms.${f}`) }))}
          invalid={has("legalForm")}
        />
        <TextField
          label={t("intl.fields.website")}
          required
          value={data.website}
          onChange={(v) => update({ website: v })}
          placeholder={t("intl.ph.website")}
          invalid={has("website")}
        />

        <TextField
          label={t("intl.fields.companyEmail")}
          required
          value={data.officialEmail}
          onChange={(v) => update({ officialEmail: v })}
          placeholder={t("intl.ph.companyEmail")}
          invalid={has("officialEmail")}
        />
        <PhoneField
          label={t("intl.fields.companyPhone")}
          required
          prefix={data.dialCode}
          dialOptions={DIAL_CODES.map((c) => ({ value: c, label: c }))}
          onPrefixChange={(v) => update({ dialCode: v })}
          value={data.phone}
          onChange={(v) => update({ phone: v })}
          placeholder={t("intl.ph.companyPhone")}
          invalid={has("phone") || has("dialCode")}
        />
          <div className="@lg:col-span-2">
            <TextField
              label={t("intl.fields.headOffice")}
              required
              value={data.headOffice}
              onChange={(v) => update({ headOffice: v })}
              placeholder={t("intl.ph.headOffice")}
              invalid={has("headOffice")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
