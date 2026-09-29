"use client";

import { useTranslations } from "next-intl";
import { Building2, Lock } from "lucide-react";
import { DRC_PROVINCES } from "@/config/provinces";
import { COUNTRIES, COUNTRY_DIAL_CODE, HOME_COUNTRY } from "@/config/geo";
import { cn } from "@/lib/utils";
import { FIELD_CLS } from "./constants";
import { isInternational, type RegisterFormData, type SectorOption } from "./types";
import { FieldLabel, SectionHeader, SelectField, TextField } from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
  sectors: SectorOption[];
}

/**
 * Short form, step 1 — identify the company.
 * Congolese: name, country (locked to the DRC), sector, province, city.
 * International: name, country, sector, head-office city.
 */
export function StepCompany({ data, update, errors, sectors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);
  const international = isInternational(data);

  const onCountryChange = (country: string) => {
    const dial = COUNTRY_DIAL_CODE[country];
    update(dial ? { country, dialCode: dial } : { country });
  };

  return (
    <div>
      <SectionHeader icon={Building2} title={t("quick.sections.company")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            label={t("fields.companyLegalName")}
            required
            value={data.companyLegalName}
            onChange={(v) => update({ companyLegalName: v })}
            placeholder={t("ph.companyLegalName")}
            invalid={has("companyLegalName")}
          />
        </div>

        {international ? (
          <SelectField
            label={t("fields.country")}
            required
            value={data.country}
            onChange={onCountryChange}
            placeholder={t("ph.country")}
            options={COUNTRIES.map((c) => ({ value: c, label: c }))}
            invalid={has("country")}
          />
        ) : (
          // A Congolese company is registered in the DRC by definition.
          <div>
            <FieldLabel required>{t("fields.country")}</FieldLabel>
            <div
              aria-readonly="true"
              className={cn(FIELD_CLS, "flex items-center justify-between bg-slate-50 text-slate-600")}
            >
              {HOME_COUNTRY}
              <Lock className="size-3.5 text-slate-400" aria-hidden />
            </div>
          </div>
        )}

        <SelectField
          label={t("fields.sector")}
          required
          value={data.sectorId}
          onChange={(v) => update({ sectorId: v })}
          placeholder={t("ph.sector")}
          options={sectors.map((s) => ({ value: s.id, label: s.label }))}
          invalid={has("sectorId")}
        />

        {international ? (
          <TextField
            label={t("quick.fields.headOfficeCity")}
            required
            value={data.city}
            onChange={(v) => update({ city: v })}
            placeholder={t("ph.city")}
            invalid={has("city")}
          />
        ) : (
          <>
            <SelectField
              label={t("fields.province")}
              required
              value={data.province}
              onChange={(v) => update({ province: v })}
              placeholder={t("ph.province")}
              options={DRC_PROVINCES.map((p) => ({ value: p, label: p }))}
              invalid={has("province")}
            />
            <TextField
              label={t("fields.city")}
              required
              value={data.city}
              onChange={(v) => update({ city: v })}
              placeholder={t("ph.city")}
              invalid={has("city")}
            />
          </>
        )}
      </div>
    </div>
  );
}
