"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Landmark } from "lucide-react";
import { COUNTRIES, COUNTRY_DIAL_CODE } from "@/config/geo";
import { LEGAL_FORMS, EMPLOYEE_RANGES, YEAR_OPTIONS } from "./constants";
import { isInternational, type RegisterFormData } from "./types";
import { SectionHeader, TextField, SelectField } from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
}

/** Step 1 — Legal Information. */
export function StepLegal({ data, update, errors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);
  // Profile — not country — decides which registries this form asks for.
  const home = !isInternational(data);

  /** Changing country also moves the phone dial code to that country's. */
  const onCountryChange = (country: string) => {
    const dial = COUNTRY_DIAL_CODE[country];
    update(dial ? { country, dialCode: dial } : { country });
  };

  return (
    <div>
      <SectionHeader icon={Landmark} title={t("sections.legal")} />
      <div className="grid gap-4 sm:grid-cols-2">
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
          label={t("fields.companyLegalName")}
          required
          value={data.companyLegalName}
          onChange={(v) => update({ companyLegalName: v })}
          placeholder={t("ph.companyLegalName")}
          invalid={has("companyLegalName")}
        />
        <TextField
          label={t("fields.tradingName")}
          value={data.tradingName}
          onChange={(v) => update({ tradingName: v })}
          placeholder={t("ph.tradingName")}
        />
        {/* RCCM / National ID / NIF are Congolese registries. Foreign companies
            see the international equivalents, and the two DRC-only identifiers
            become optional rather than blocking the application. */}
        <TextField
          label={home ? t("fields.rccmNumber") : t("fields.registrationNumber")}
          required
          value={data.rccmNumber}
          onChange={(v) => update({ rccmNumber: v })}
          placeholder={home ? t("ph.rccmNumber") : t("ph.registrationNumber")}
          invalid={has("rccmNumber")}
        />
        <TextField
          label={home ? t("fields.nationalId") : t("fields.nationalIdIntl")}
          required={home}
          value={data.nationalId}
          onChange={(v) => update({ nationalId: v })}
          placeholder={home ? t("ph.nationalId") : t("ph.nationalIdIntl")}
          invalid={has("nationalId")}
        />
        <TextField
          label={home ? t("fields.nif") : t("fields.taxIdIntl")}
          required={home}
          value={data.nif}
          onChange={(v) => update({ nif: v })}
          placeholder={home ? t("ph.nif") : t("ph.taxIdIntl")}
          invalid={has("nif")}
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
        <SelectField
          label={t("fields.employees")}
          required
          value={data.employees}
          onChange={(v) => update({ employees: v })}
          placeholder={t("ph.employees")}
          options={EMPLOYEE_RANGES.map((r) => ({
            value: r,
            label: t(`employeeRanges.${r}`),
          }))}
          invalid={has("employees")}
        />
      </div>
    </div>
  );
}
