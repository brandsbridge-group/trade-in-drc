"use client";

import { useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { DIAL_CODES } from "@/config/geo";
import { SPOKEN_LANGUAGES, PREFERRED_CONTACTS } from "./constants";
import type { RegisterFormData } from "./types";
import {
  SectionHeader,
  TextField,
  SelectField,
  PhoneField,
  ChipGroup,
  toggleValue,
} from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
}

/** International step 4 — Contact Person: who we actually talk to. */
export function StepIntlContactPerson({ data, update, errors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);

  const toggleLanguage = (lang: string) =>
    update({ languages: toggleValue(data.languages, lang) });

  return (
    <div>
      <SectionHeader icon={UserRound} title={t("intl.sections.contactPerson")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t("fields.contactPerson")}
          required
          value={data.contactPerson}
          onChange={(v) => update({ contactPerson: v })}
          placeholder={t("ph.contactPerson")}
          invalid={has("contactPerson")}
        />
        <TextField
          label={t("fields.jobTitle")}
          required
          value={data.jobTitle}
          onChange={(v) => update({ jobTitle: v })}
          placeholder={t("ph.jobTitle")}
          invalid={has("jobTitle")}
        />
        <PhoneField
          label={t("intl.fields.directPhone")}
          prefix={data.dialCode}
          dialOptions={DIAL_CODES.map((c) => ({ value: c, label: c }))}
          onPrefixChange={(v) => update({ dialCode: v })}
          value={data.altPhone}
          onChange={(v) => update({ altPhone: v })}
          placeholder={t("intl.ph.directPhone")}
        />
        <SelectField
          label={t("fields.preferredContact")}
          value={data.preferredContact}
          onChange={(v) => update({ preferredContact: v })}
          placeholder={t("ph.preferredContact")}
          options={PREFERRED_CONTACTS.map((c) => ({
            value: c,
            label: t(`preferredContacts.${c}`),
          }))}
        />
      </div>

      <div className="mt-4">
        <ChipGroup
          label={t("fields.languages")}
          required
          options={SPOKEN_LANGUAGES.map((l) => ({
            value: l,
            label: t(`languages.${l}`),
          }))}
          selected={data.languages}
          onToggle={toggleLanguage}
          invalid={has("languages")}
        />
      </div>
    </div>
  );
}
