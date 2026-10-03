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
  "flex size-8 items-center justify-center rounded-lg bg-market-navy text-sm font-bold text-white shadow-sm";

interface NeedTilesProps {
  selected: BusinessNeed | null;
  onSelect: (need: BusinessNeed) => void;
}

/** Column 1 — the single-select grid of primary needs (radio behavior). */
export function NeedTiles({ selected, onSelect }: NeedTilesProps) {
  const t = useTranslations("FindPartner");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.55)] md:p-5">
      <div className="mb-2 flex items-center gap-2.5">
        <span className={STEP_BADGE} aria-hidden>
          1
        </span>
        <h2 className="font-display text-lg font-bold text-market-navy">
          {t("step1.title")}
        </h2>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-slate-500">{t("step1.subtitle")}</p>

      <div
        role="radiogroup"
        aria-label={t("step1.title")}
        className="grid grid-cols-2 gap-2.5"
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
                "flex min-h-[112px] flex-col items-start gap-3 rounded-lg border p-3.5 text-left transition-all duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-market-navy/40",
                active
                  ? "border-market-navy bg-market-navy/[0.045] ring-1 ring-market-navy shadow-[0_12px_24px_-20px_rgba(13,29,62,0.75)]"
                  : "border-slate-200 bg-white hover:border-market-navy/35 hover:bg-slate-50/80"
              )}
            >
              <span className={cn("grid size-9 place-items-center rounded-lg", active ? "bg-market-navy text-white" : "bg-slate-100 text-market-navy/75")}>
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="text-sm font-semibold leading-snug text-slate-800">
                {t(`needs.${need}`)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t("step1.footnote")}
      </p>
    </section>
  );
}
