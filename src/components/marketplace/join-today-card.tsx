import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Link } from "@/i18n/routing";

const BENEFITS = ["profile", "browse", "connect", "intelligence"] as const;

/** "Join the Marketplace Today" — right card of the bottom band. */
export async function JoinTodayCard() {
  const t = await getTranslations("MarketplacePage.join");
  return (
    <section className="h-full rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-[var(--color-landing-navy)]">
        {t("heading")}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-snug text-slate-600">{t("body")}</p>

      {/* Copy and CTAs sit beside the device mockup — never underneath it, so
          the button labels are always fully readable (design: two columns). */}
      <div className="mt-4 flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <ul className="space-y-2">
            {BENEFITS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-[12.5px] text-slate-700">
                <CheckCircle2 className="h-4 w-4 flex-none text-primary" aria-hidden />
                {t(`benefits.${key}`)}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/register-company"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white transition-colors duration-150 ease-out hover:bg-[#003a8c]"
            >
              {t("ctaRegister")}
              <ArrowRight className="h-4 w-4 flex-none" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 px-4 py-2.5 text-center text-[13px] font-bold text-primary transition-colors duration-150 ease-out hover:bg-primary/5"
            >
              {t("ctaPremium")}
              <ArrowRight className="h-4 w-4 flex-none" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Device mockup from the customer artwork — decorative. */}
        <Image
          src="/images/marketplace/devices.png"
          alt=""
          width={812}
          height={536}
          aria-hidden
          className="hidden w-[38%] max-w-[210px] flex-none xl:block"
        />
      </div>
    </section>
  );
}
