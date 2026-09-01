"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ProfileChooser } from "./profile-chooser";
import type { RegistrationProfile } from "./constants";

interface Props {
  selected: RegistrationProfile;
  onSelect: (profile: RegistrationProfile) => void;
  onContinue: () => void;
}

/**
 * P2-1: the first screen of registration — one decision only ("what kind of
 * company are you?"), no pricing, no stepper. The client's complaint was
 * that the account-type choice and the plan/pricing choice competed for
 * attention on the same screen; this gate makes the account-type decision
 * the whole screen, and `register-wizard.tsx` only mounts the stepper + form
 * (phase `"form"`) after Continue is pressed here.
 *
 * `congolese` is preselected (`types.ts` EMPTY_FORM.profile), so Continue is
 * always live on first paint — nobody is blocked by an unmade choice.
 */
export function ProfileGate({ selected, onSelect, onContinue }: Props) {
  const t = useTranslations("RegisterCompany.profileChooser");

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pt-8 pb-10 md:px-6">
      {/* h2, not h1: RegisterHero (register-hero.tsx) renders the page's
          single h1 above this section. This gate's heading is a subsection
          question ("what kind of company are you?"), not the page title —
          demoted for one-h1-per-page semantics; visual size unchanged. */}
      <h2 className="font-display text-lg font-bold text-market-navy">{t("heading")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("subheading")}</p>

      <ProfileChooser selected={selected} onSelect={onSelect} />

      <div className="mt-6 flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{t("freeNote")}</p>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[0.5rem] bg-market-navy px-6 text-sm font-bold text-white transition-colors duration-150 ease-out hover:bg-market-navy-deep sm:w-auto"
        >
          {t("continue")} <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
