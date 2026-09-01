"use client";

import { useTranslations } from "next-intl";
import { Building2, Globe, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTRATION_PROFILES, type RegistrationProfile } from "./constants";

const ICONS: Record<RegistrationProfile, typeof Building2> = {
  congolese: Building2,
  international: Globe,
};

/**
 * The "choose your company profile" card pair — pure grid, no heading or
 * CTA of its own. Rendered inside `profile-gate.tsx` (the dedicated gate
 * screen, P2-1) so the account-type decision never shares a viewport with
 * the wizard/stepper.
 *
 * P2-3 (390px -> 1920px): three classes below are load-bearing, not
 * stylistic —
 *  - `pr-12` reserves a lane on the right so the selected-check badge /
 *    chevron never sits on top of the title at narrow widths.
 *  - `min-w-0 flex-1` on the text wrapper is what stops the card causing
 *    horizontal scroll when a long FR title has nowhere else to shrink.
 *  - `items-start` (not `items-center`) keeps the icon pinned to the first
 *    line of the title instead of re-centering when FR wraps to 2-3 lines.
 */
export function ProfileChooser({
  selected,
  onSelect,
}: {
  selected: RegistrationProfile;
  onSelect: (profile: RegistrationProfile) => void;
}) {
  const t = useTranslations("RegisterCompany.profileChooser");

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {REGISTRATION_PROFILES.map((profile) => {
        const Icon = ICONS[profile];
        const active = selected === profile;
        return (
          <button
            key={profile}
            type="button"
            onClick={() => onSelect(profile)}
            aria-pressed={active}
            className={cn(
              "group relative flex w-full min-h-[112px] items-start gap-4 rounded-xl border-2 bg-white p-5 pr-12 text-left transition-colors duration-150 ease-out",
              active
                ? "border-primary shadow-sm"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <span
              className={cn(
                "grid size-12 flex-none place-items-center rounded-full transition-colors duration-150 sm:size-14",
                active ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
              )}
            >
              <Icon className="size-6 sm:size-7" strokeWidth={1.75} aria-hidden />
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block font-display text-base font-bold",
                  active ? "text-primary" : "text-market-navy"
                )}
              >
                {t(`${profile}.title`)}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-slate-600">
                {t(`${profile}.body`)}
              </span>
            </span>

            {active ? (
              <span className="absolute right-4 top-4 grid size-6 flex-none place-items-center rounded-full bg-primary text-white">
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </span>
            ) : (
              <ChevronRight
                className="absolute right-4 top-4 size-5 flex-none text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
