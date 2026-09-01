"use client";
import { useTranslations } from "next-intl";
import { SEGMENT_KEYS } from "@/lib/marketplace/segments";
import { FilterGroup, FilterItem } from "@/components/design";
import { mergeFilterHref, type FilterParams } from "./filter-url";

export function SegmentsFilter({
  activeSegment,
  basePath,
  params = {},
}: {
  activeSegment?: string;
  basePath: string;
  params?: FilterParams;
}) {
  const t = useTranslations("ListPages.filters");
  const tSeg = useTranslations("Market.segments");
  return (
    <FilterGroup label={t("segments")}>
      <FilterItem
        label={t("any")}
        href={mergeFilterHref(basePath, params, "segment", undefined)}
        active={!activeSegment}
      />
      {SEGMENT_KEYS.map((s) => (
        <FilterItem
          key={s}
          label={tSeg(s)}
          href={mergeFilterHref(basePath, params, "segment", s)}
          active={activeSegment === s}
        />
      ))}
    </FilterGroup>
  );
}
