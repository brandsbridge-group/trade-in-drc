"use client";

import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import { DRC_PROVINCES } from "@/config/provinces";
import { DRC_INTERESTS, ENTRY_TIMELINES } from "./constants";
import type { RegisterFormData } from "./types";
import { ChipGroup, SectionHeader, SelectField, toggleValue } from "./field-kit";

interface Props {
  data: RegisterFormData;
  update: (patch: Partial<RegisterFormData>) => void;
}

/**
 * Short form, international step 3 — OPTIONAL. Nothing here is required; the
 * wizard offers "Skip this step". The fuller StepIntlMarketInterest (with
 * notes) stays for the dashboard's "Complete your profile" action.
 */
export function StepMarketInterestOptional({ data, update }: Props) {
  const t = useTranslations("RegisterCompany");

  return (
    <div>
      <SectionHeader icon={Target} title={t("intl.sections.marketInterest")} />
      <p className="-mt-2 mb-5 text-sm text-slate-600">{t("quick.marketInterestIntro")}</p>

      <div className="grid gap-4">
        <ChipGroup
          label={t("intl.fields.drcInterests")}
          options={DRC_INTERESTS.map((i) => ({ value: i, label: t(`intl.drcInterests.${i}`) }))}
          selected={data.drcInterests}
          onToggle={(v) => update({ drcInterests: toggleValue(data.drcInterests, v) })}
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
            value={data.entryTimeline}
            onChange={(v) => update({ entryTimeline: v })}
            placeholder={t("intl.ph.entryTimeline")}
            options={ENTRY_TIMELINES.map((e) => ({ value: e, label: t(`intl.entryTimelines.${e}`) }))}
          />
        </div>
      </div>
    </div>
  );
}
