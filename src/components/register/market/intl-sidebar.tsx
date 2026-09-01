"use client";

import { useTranslations } from "next-intl";
import { Award, Check, Phone, Mail, MapPin, ArrowRight, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { findPlan, formatPlanPrice } from "@/config/promotion-plans";
import {
  CONTACT,
  CONTACT_ADDRESS,
  CONTACT_EMAIL_HREF,
  CONTACT_PHONE_HREF,
} from "@/config/contact";

const PREMIUM_BULLETS = 10;

interface Props {
  onChoosePremium: () => void;
  /** P1-6: a $3,600/year choice must be visibly stuck, not confirmed by a
   *  toast alone — this rings the card and swaps the CTA to a "Selected"
   *  state once `plan === "premium"`. */
  premiumSelected: boolean;
}

/**
 * Right-hand column of the international registration design: the navy
 * "Premium International Profile — USD 3,600 / year" card, and the help card
 * beneath it. Contact details come from config/contact.ts — the single source
 * of truth confirmed by the customer, not the agency details in the artwork.
 */
export function IntlSidebar({ onChoosePremium, premiumSelected }: Props) {
  const t = useTranslations("RegisterCompany.intl");

  return (
    <aside className="space-y-4">
      {/* Premium International Profile */}
      <section
        className={cn(
          "rounded-xl bg-[var(--color-landing-navy)] p-5 text-white transition-shadow duration-150",
          premiumSelected && "ring-2 ring-market-gold"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{t("premiumCard.title")}</h2>
            <p className="mt-1 font-display text-xl font-extrabold text-market-gold">
              {formatPlanPrice(findPlan("international")!.amountUsd)}
              <span className="ml-1 text-xs font-semibold text-white/70">
                {t("premiumCard.perYear")}
              </span>
            </p>
          </div>
          {premiumSelected ? (
            <BadgeCheck className="size-9 flex-none text-market-gold" strokeWidth={1.5} aria-hidden />
          ) : (
            <Award className="size-9 flex-none text-market-gold" strokeWidth={1.5} aria-hidden />
          )}
        </div>

        <ul className="mt-4 space-y-2">
          {Array.from({ length: PREMIUM_BULLETS }, (_, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-white/90">
              <Check className="mt-0.5 size-3.5 flex-none text-market-gold" strokeWidth={2.5} aria-hidden />
              {t(`premiumCard.bullets.${i}`)}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onChoosePremium}
          aria-pressed={premiumSelected}
          className={cn(
            "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold transition-colors duration-150 ease-out",
            premiumSelected
              ? "bg-white/15 text-white"
              : "bg-market-gold text-[var(--color-landing-navy)] hover:bg-yellow-400"
          )}
        >
          {premiumSelected && <Check className="size-4" strokeWidth={3} aria-hidden />}
          {premiumSelected ? t("premiumCard.selectedCta") : t("premiumCard.cta")}
        </button>
      </section>

      {/* Need help getting started? */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-market-navy">
          {t("help.title")}
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-snug text-slate-600">{t("help.body")}</p>

        <ul className="mt-4 space-y-2.5 text-[13px]">
          <li className="flex items-center gap-2.5">
            <Phone className="size-4 flex-none text-primary" aria-hidden />
            <a href={CONTACT_PHONE_HREF} className="text-slate-700 transition-colors duration-150 hover:text-primary">
              {CONTACT.phone}
            </a>
          </li>
          <li className="flex items-center gap-2.5">
            <Mail className="size-4 flex-none text-primary" aria-hidden />
            <a href={CONTACT_EMAIL_HREF} className="text-slate-700 transition-colors duration-150 hover:text-primary">
              {CONTACT.email}
            </a>
          </li>
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 flex-none text-primary" aria-hidden />
            <span className="whitespace-pre-line text-slate-700">{CONTACT_ADDRESS}</span>
          </li>
        </ul>

        <Link
          href="/contact"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-[13px] font-semibold text-market-navy transition-colors duration-150 ease-out hover:bg-slate-50"
        >
          {t("help.cta")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </aside>
  );
}
