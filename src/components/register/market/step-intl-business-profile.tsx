"use client";

import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { EMPLOYEE_RANGES, TURNOVER_RANGES } from "./constants";
import type { RegisterFormData, SectorOption } from "./types";
import {
  SectionHeader,
  TextField,
  SelectField,
  TextAreaField,
} from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
  sectors: SectorOption[];
}

/** International step 2 — Business Profile: what the company actually does. */
export function StepIntlBusinessProfile({ data, update, errors, sectors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);

  return (
    <div>
      <SectionHeader icon={Briefcase} title={t("intl.sections.businessProfile")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t("fields.sector")}
          required
          value={data.sectorId}
          onChange={(v) => update({ sectorId: v })}
          placeholder={t("ph.sector")}
          options={sectors.map((s) => ({ value: s.id, label: s.label }))}
          invalid={has("sectorId")}
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
        <SelectField
          label={t("intl.fields.annualTurnover")}
          value={data.annualTurnover}
          onChange={(v) => update({ annualTurnover: v })}
          placeholder={t("intl.ph.annualTurnover")}
          options={TURNOVER_RANGES.map((r) => ({
            value: r,
            label: t(`intl.turnoverRanges.${r}`),
          }))}
        />
        <TextField
          label={t("intl.fields.currentMarkets")}
          value={data.currentMarkets}
          onChange={(v) => update({ currentMarkets: v })}
          placeholder={t("intl.ph.currentMarkets")}
        />
      </div>

      <div className="mt-4 grid gap-4">
        <TextAreaField
          label={t("intl.fields.productsServices")}
          required
          value={data.productsServices}
          onChange={(v) => update({ productsServices: v })}
          placeholder={t("intl.ph.productsServices")}
          invalid={has("productsServices")}
        />
        <TextField
          label={t("intl.fields.certifications")}
          value={data.certifications}
          onChange={(v) => update({ certifications: v })}
          placeholder={t("intl.ph.certifications")}
        />
      </div>
    </div>
  );
}
