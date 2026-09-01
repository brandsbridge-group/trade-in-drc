"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Factory,
  Truck,
  UserRound,
  Handshake,
  Settings,
  Landmark,
  Globe,
  Package,
  Info,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NEEDS, type BusinessNeed } from "./find-partner-config";

/** Per-need glyph — matches the design's tile icons. */
const NEED_ICONS: Record<BusinessNeed, LucideIcon> = {
  supplier: Factory,
  distributor: Truck,
  representative: UserRound,
  jv_partner: Handshake,
  service_provider: Settings,
  institutional: Landmark,
  enter_market: Globe,
  source_products: Package,
};

const STEP_BADGE =
  "flex size-7 items-center justify-center rounded-md bg-market-navy text-sm font-bold text-white";

interface NeedTilesProps {
  selected: BusinessNeed | null;
  onSelect: (need: BusinessNeed) => void;
}

/** Column 1 — the single-select grid of primary needs (radio behavior). */
export function NeedTiles({ selected, onSelect }: NeedTilesProps) {
  const t = useTranslations("FindPartner");

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className={STEP_BADGE} aria-hidden>
          1
        </span>
        <h2 className="font-display text-lg font-bold text-market-navy">
          {t("step1.title")}
        </h2>
      </div>
      <p className="mb-4 text-sm text-slate-500">{t("step1.subtitle")}</p>

      <div
        role="radiogroup"
        aria-label={t("step1.title")}
        className="grid grid-cols-2 gap-3"
      >
        {NEEDS.map((need) => {
          const Icon = NEED_ICONS[need];
          const active = selected === need;
          return (
            <button
              key={need}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(need)}
              className={cn(
                "flex flex-col items-start gap-2.5 rounded-lg border p-3.5 text-left transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-navy/40",
                active
                  ? "border-market-navy bg-market-navy/[0.04] ring-1 ring-market-navy"
                  : "border-slate-200 hover:border-market-navy/50 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  active ? "text-market-navy" : "text-market-navy/70"
                )}
                aria-hidden
              />
              <span className="text-sm font-semibold leading-snug text-slate-800">
                {t(`needs.${need}`)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t("step1.footnote")}
      </p>
    </div>
  );
}
