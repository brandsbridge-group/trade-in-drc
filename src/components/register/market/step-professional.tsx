"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { DRC_PROVINCES } from "@/config/provinces";
import { DIAL_CODES } from "@/config/geo";
import { isHomeCountry, type RegisterFormData, type SectorOption } from "./types";
import {
  SectionHeader,
  TextField,
  SelectField,
  PhoneField,
  FieldLabel,
} from "./field-kit";
import { FIELD_CLS } from "./constants";
import { cn } from "@/lib/utils";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
  sectors: SectorOption[];
}

/** Step 2 — Professional Information. */
export function StepProfessional({ data, update, errors, sectors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);
  const home = isHomeCountry(data);
  const dialOptions = DIAL_CODES.map((c) => ({ value: c, label: c }));

  return (
    <div>
      <SectionHeader icon={Briefcase} title={t("sections.professional")} />
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
        <TextField
          label={t("fields.productsServices")}
          value={data.productsServices}
          onChange={(v) => update({ productsServices: v })}
          placeholder={t("ph.productsServices")}
        />
        {/* The 26 provinces only exist in the DRC; elsewhere it is free text. */}
        {home ? (
          <SelectField
            label={t("fields.province")}
            required
            value={data.province}
            onChange={(v) => update({ province: v })}
            placeholder={t("ph.province")}
            options={DRC_PROVINCES.map((p) => ({ value: p, label: p }))}
            invalid={has("province")}
          />
        ) : (
          <TextField
            label={t("fields.region")}
            value={data.province}
            onChange={(v) => update({ province: v })}
            placeholder={t("ph.region")}
            invalid={has("province")}
          />
        )}
        <TextField
          label={t("fields.city")}
          required
          value={data.city}
          onChange={(v) => update({ city: v })}
          placeholder={t("ph.city")}
          invalid={has("city")}
        />
        <TextField
          label={t("fields.website")}
          value={data.website}
          onChange={(v) => update({ website: v })}
          placeholder={t("ph.website")}
        />
        <div>
          <FieldLabel required>{t("fields.officialEmail")}</FieldLabel>
          <input
            type="email"
            value={data.officialEmail}
            onChange={(e) => update({ officialEmail: e.target.value })}
            placeholder={t("ph.officialEmail")}
            className={cn(FIELD_CLS, has("officialEmail") && "border-market-red")}
          />
        </div>
        <PhoneField
          label={t("fields.phone")}
          required
          prefix={data.dialCode}
          dialOptions={dialOptions}
          onPrefixChange={(v) => update({ dialCode: v })}
          value={data.phone}
          onChange={(v) => update({ phone: v })}
          placeholder={t("ph.phone")}
          invalid={has("phone")}
        />
        <PhoneField
          label={t("fields.altPhone")}
          prefix={data.dialCode}
          dialOptions={dialOptions}
          onPrefixChange={(v) => update({ dialCode: v })}
          value={data.altPhone}
          onChange={(v) => update({ altPhone: v })}
          placeholder={t("ph.phone")}
        />
      </div>
    </div>
  );
}
