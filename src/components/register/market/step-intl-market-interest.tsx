"use client";

import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import { DRC_PROVINCES } from "@/config/provinces";
import { DRC_INTERESTS, ENTRY_TIMELINES } from "./constants";
import type { RegisterFormData } from "./types";
import {
  SectionHeader,
  SelectField,
  TextAreaField,
  ChipGroup,
  toggleValue,
} from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
  errors: Set<keyof RegisterFormData>;
}

/**
 * International step 3 — DRC Market Interest. This is the step that makes an
 * international application useful to the portal: what they want to do here,
 * where, and how soon.
 */
export function StepIntlMarketInterest({ data, update, errors }: Props) {
  const t = useTranslations("RegisterCompany");
  const has = (k: keyof RegisterFormData) => errors.has(k);

  return (
    <div>
      <SectionHeader icon={Target} title={t("intl.sections.marketInterest")} />

      <div className="grid gap-4">
        <ChipGroup
          label={t("intl.fields.drcInterests")}
          required
          options={DRC_INTERESTS.map((i) => ({
            value: i,
            label: t(`intl.drcInterests.${i}`),
          }))}
          selected={data.drcInterests}
          onToggle={(v) => update({ drcInterests: toggleValue(data.drcInterests, v) })}
          invalid={has("drcInterests")}
        />

        <ChipGroup
          label={t("intl.fields.targetProvinces")}
          options={DRC_PROVINCES.map((p) => ({ value: p, label: p }))}
          selected={data.targetProvinces}
          onToggle={(v) => update({ targetProvinces: toggleValue(data.targetProvinces, v) })}
        />

        <div className="sm:max-w-sm">
          <SelectField
            label={t("intl.fields.entryTimeline")}
            required
            value={data.entryTimeline}
            onChange={(v) => update({ entryTimeline: v })}
            placeholder={t("intl.ph.entryTimeline")}
            options={ENTRY_TIMELINES.map((e) => ({
              value: e,
              label: t(`intl.entryTimelines.${e}`),
            }))}
            invalid={has("entryTimeline")}
          />
        </div>

        <TextAreaField
          label={t("intl.fields.marketInterestNotes")}
          required
          rows={5}
          value={data.marketInterestNotes}
          onChange={(v) => update({ marketInterestNotes: v })}
          placeholder={t("intl.ph.marketInterestNotes")}
          invalid={has("marketInterestNotes")}
        />
      </div>
    </div>
  );
}
