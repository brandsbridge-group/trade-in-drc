import { getTranslations } from "next-intl/server";
import { Phone, FileText, Building2, Send } from "lucide-react";
import { Link } from "@/i18n/routing";
import { CONTACT, CONTACT_EMAIL_HREF, CONTACT_PHONE_HREF } from "@/config/contact";
import { PremiumApplyButton } from "./premium-apply-form";

/**
 * Navy CTA bar closing the promote page (customer design 2026-07-28).
 * The design shows agency contacts here; per the customer's 2026-07-28
 * instruction every contact surface uses the platform details instead.
 *
 * Server component — the only interactive part is the PremiumApplyButton leaf.
 */
export async function PromoteCtaBar() {
  const t = await getTranslations("Premium.promote.ctaBar");

  return (
    <section className="bg-[var(--color-landing-navy)] text-white">
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-5 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex items-start gap-3.5">
          <span className="grid size-11 flex-none place-items-center rounded-full bg-primary">
            <Phone className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold">{t("heading")}</h2>
            <p className="mt-0.5 text-[13px] text-white/70">{t("body")}</p>
            <p className="mt-1 text-[13px] text-white/90">
              <a href={CONTACT_PHONE_HREF} className="transition-colors duration-150 hover:text-market-gold">
                {CONTACT.phone}
              </a>
              <span className="mx-2 text-white/30">|</span>
              <a href={CONTACT_EMAIL_HREF} className="transition-colors duration-150 hover:text-market-gold">
                {CONTACT.email}
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <PremiumApplyButton
            label={t("requestPackage")}
            icon={<FileText className="size-4" aria-hidden />}
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-white/10"
          />
          <Link
            href="/register-company"
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-white/10"
          >
            <Building2 className="size-4" aria-hidden />
            {t("registerCompany")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-market-red px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-market-red-dark"
          >
            <Send className="size-4" aria-hidden />
            {t("contactUs")}
          </Link>
        </div>
      </div>
    </section>
  );
}
