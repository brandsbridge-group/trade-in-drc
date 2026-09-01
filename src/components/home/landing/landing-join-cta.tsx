import { getTranslations } from "next-intl/server";
import { ArrowRight, Users, Globe2 } from "lucide-react";
import { Link } from "@/i18n/routing";

export async function LandingJoinCta({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.join" });
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4">
        <div className="grid overflow-hidden rounded-2xl md:grid-cols-2">
          <Link
            href="/register-company"
            className="group flex items-center justify-between gap-4 bg-landing-gold px-7 py-7 text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:bg-[var(--color-landing-gold-soft)]"
          >
            <span className="flex items-center gap-3 text-xl font-extrabold">
              <Users className="h-6 w-6" />
              {t("cta")}
            </span>
            <ArrowRight className="h-6 w-6 transition-transform duration-150 ease-out group-hover:translate-x-1" />
          </Link>
          <div className="flex items-center justify-between gap-4 bg-[var(--color-landing-navy)] px-7 py-7 text-white">
            <span className="text-lg font-semibold">{t("tagline")}</span>
            <Globe2 className="h-7 w-7 shrink-0 text-landing-gold" />
          </div>
        </div>
      </div>
    </section>
  );
}
