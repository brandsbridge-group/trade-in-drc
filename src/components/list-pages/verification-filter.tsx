"use client";
import { useTranslations } from "next-intl";
import { FilterGroup, FilterItem } from "@/components/design";
import { mergeFilterHref, type FilterParams } from "./filter-url";

const TIERS = ["any", "verified", "premium", "basic", "none"] as const;

export function VerificationFilter({
  activeTier,
  basePath,
  params = {},
}: {
  activeTier?: string;
  basePath: string;
  params?: FilterParams;
}) {
  const t = useTranslations("ListPages.filters");
  const tBadge = useTranslations("Trust.badge");
  return (
    <FilterGroup label={t("verification")}>
      {TIERS.map((tier) => {
        const label = tier === "any" ? t("any") : tBadge(tier);
        const href =
          tier === "any"
            ? mergeFilterHref(basePath, params, "tier", undefined)
            : mergeFilterHref(basePath, params, "tier", tier);
        const active = (activeTier ?? "any") === tier;
        return <FilterItem key={tier} label={label} href={href} active={active} />;
      })}
    </FilterGroup>
  );
}
