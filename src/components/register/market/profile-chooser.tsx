"use client";

import { useTranslations } from "next-intl";
import { Building2, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGISTRATION_PROFILES, type RegistrationProfile } from "./constants";

const ICONS: Record<RegistrationProfile, typeof Building2> = {
  congolese: Building2,
  international: Globe,
};

/**
 * The "choose your company profile" card pair — pure grid, no heading or
 * CTA of its own. Rendered inside `profile-gate.tsx` so the account-type
 * decision never shares a viewport with the stepper. Dashboard visual
 * language: white `rounded-2xl` cards, navy ring on the selected one.
 *
 * Load-bearing classes (390px → 1920px):
 *  - `pr-12` reserves a lane on the right so the selected-check badge never
 *    sits on top of the title at narrow widths.
 *  - `min-w-0 flex-1` on the text wrapper stops a long FR title causing
 *    horizontal scroll.
 *  - `items-start` keeps the icon pinned to the first line when FR wraps.
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
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              "relative flex min-h-[112px] w-full min-w-0 items-start gap-4 rounded-2xl p-5 pr-12 text-left transition-colors duration-150 ease-out",
              active ? "bg-white ring-2 ring-market-navy" : "bg-slate-50 ring-1 ring-slate-200/80 hover:bg-white"
            )}
          >
            <span
              className={cn(
                "grid size-12 flex-none place-items-center rounded-full transition-colors duration-150",
                active ? "bg-market-navy text-market-or-light" : "bg-white text-slate-500 ring-1 ring-slate-200/80"
              )}
            >
              <Icon className="size-6" strokeWidth={1.75} aria-hidden />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-semibold text-market-navy">
                {t(`${profile}.title`)}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-slate-500">
                {t(`${profile}.body`)}
              </span>
            </span>

            {active && (
              <span className="absolute right-4 top-4 grid size-6 flex-none place-items-center rounded-full bg-market-or text-market-navy">
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
