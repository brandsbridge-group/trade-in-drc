"use client";

import { useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import {
  getCountries,
  getCountryCallingCode,
  type Country,
  type Value,
} from "react-phone-number-input";
import { cn } from "@/lib/utils";
import { PhoneNumberInput } from "@/components/auth/phone-field";
import { FIELD_CLS } from "./constants";
import { isInternational, type RegisterFormData } from "./types";
import { FieldLabel, SectionHeader, TextField } from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
}

/** First ISO country using this dial code ("+243" → "CD"), to preselect the picker. */
function countryForDialCode(dialCode: string): Country | undefined {
  const code = dialCode.replace(/\D/g, "");
  if (!code) return undefined;
  return getCountries().find((c) => getCountryCallingCode(c) === code);
}

/**
 * Short form, step 2 — how to reach the company.
 *
 * `officialEmail` is the company's PUBLIC contact address, distinct from the
 * account's login e-mail (prefilled with it, editable), so a shared address
 * like contact@company.cd can front the listing. The phone is held as E.164
 * in `data.phone` while editing; the wizard splits it into dialCode + number
 * on submit.
 */
export function StepContact({ data, update, errors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);

  return (
    <div>
      <SectionHeader icon={Mail} title={t("quick.sections.contact")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel required>{t("quick.fields.companyEmail")}</FieldLabel>
          <input
            type="email"
            autoComplete="email"
            value={data.officialEmail}
            onChange={(e) => update({ officialEmail: e.target.value })}
            placeholder={t("ph.officialEmail")}
            className={cn(FIELD_CLS, has("officialEmail") && "border-market-red")}
          />
          <p className="mt-1 text-xs text-slate-500">{t("quick.hints.companyEmail")}</p>
        </div>

        <TextField
          label={t("fields.contactPerson")}
          required
          value={data.contactPerson}
          onChange={(v) => update({ contactPerson: v })}
          placeholder={t("ph.contactPerson")}
          invalid={has("contactPerson")}
        />

        <div>
          <FieldLabel required>{t("fields.phone")}</FieldLabel>
          <PhoneNumberInput
            id="company-phone"
            value={(data.phone || undefined) as Value | undefined}
            onChange={(v) => update({ phone: v ?? "" })}
            defaultCountry={isInternational(data) ? countryForDialCode(data.dialCode) : "CD"}
            placeholder={t("ph.phone")}
            invalid={has("phone")}
            className="rounded-xl border-slate-200 bg-white shadow-none focus-within:border-market-navy focus-within:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
