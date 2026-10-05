"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ProfileChooser } from "./profile-chooser";
import type { RegistrationProfile } from "./constants";

interface Props {
  selected: RegistrationProfile;
  onSelect: (profile: RegistrationProfile) => void;
  onContinue: () => void;
  /** Signed out → Continue leads to account creation first (SIGNUP_REDIRECT).
   *  Defence in depth: the form lives in the dashboard, so a session is the norm. */
  signedIn: boolean;
}

/**
 * The first screen of company registration — one decision only ("what kind
 * of company are you?"), no pricing, no stepper. `register-wizard.tsx` only
 * mounts the stepper + form (phase `"form"`) after Continue is pressed here.
 *
 * `congolese` is preselected (`types.ts` EMPTY_FORM.profile), so Continue is
 * always live on first paint — nobody is blocked by an unmade choice.
 */
export function ProfileGate({ selected, onSelect, onContinue, signedIn }: Props) {
  const t = useTranslations("RegisterCompany.profileChooser");

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/70 md:p-7">
      {/* h2: the dashboard page renders the single h1 above this card. */}
      <h2 className="font-display text-base font-semibold text-market-navy">{t("heading")}</h2>
      <p className="mt-0.5 text-xs text-slate-500">{t("subheading")}</p>

      <ProfileChooser selected={selected} onSelect={onSelect} />

      <div className="mt-6 flex flex-col-reverse items-start gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          <p>{t("freeNote")}</p>
          {!signedIn && <p className="mt-1 font-medium text-slate-600">{t("accountNeeded")}</p>}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-market-navy px-6 text-[13px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-market-navy-deep sm:w-auto"
        >
          {signedIn ? t("continue") : t("createAccountToContinue")} <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
