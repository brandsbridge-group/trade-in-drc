"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SPOKEN_LANGUAGES,
  OPPORTUNITY_INTERESTS,
  PREFERRED_CONTACTS,
  FIELD_CLS,
} from "./constants";
import type { RegisterFormData } from "./types";
import {
  ChipGroup,
  FieldLabel,
  SectionHeader,
  SelectField,
  TextField,
  toggleValue,
} from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
}

/** Step 3 — Partnership Positioning (language chips + interest checkboxes). */
export function StepPositioning({ data, update, errors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);

  const toggleLanguage = (lang: string) =>
    update({ languages: toggleValue(data.languages, lang) });

  const toggleInterest = (item: string) =>
    update({ interests: toggleValue(data.interests, item) });

  return (
    <div>
      <SectionHeader icon={Handshake} title={t("sections.positioning")} />
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

      {/* Languages Spoken — selectable removable chips */}
      <div className="mt-4">
        <ChipGroup
          label={t("fields.languages")}
          required
          removable
          options={SPOKEN_LANGUAGES.map((l) => ({
            value: l,
            label: t(`languages.${l}`),
          }))}
          selected={data.languages}
          onToggle={toggleLanguage}
          invalid={has("languages")}
        />
      </div>

      {/* International Opportunities of Interest — checkbox list */}
      <div className="mt-4">
        <FieldLabel required>{t("fields.interests")}</FieldLabel>
        <div
          className={cn(
            "grid gap-2 rounded-[0.5rem] border border-slate-300 p-3 sm:grid-cols-2",
            has("interests") && "border-market-red"
          )}
        >
          {OPPORTUNITY_INTERESTS.map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={data.interests.includes(item)}
                onChange={() => toggleInterest(item)}
                className="size-4 rounded border-slate-300 accent-market-navy"
              />
              {t(`interests.${item}`)}
            </label>
          ))}
        </div>
        {data.interests.includes("other") && (
          <input
            value={data.interestOther}
            onChange={(e) => update({ interestOther: e.target.value })}
            placeholder={t("ph.interestOther")}
            className={cn(FIELD_CLS, "mt-2")}
          />
        )}
      </div>
    </div>
  );
}
