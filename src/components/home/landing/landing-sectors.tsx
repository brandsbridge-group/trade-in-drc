import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { MotionEnter } from "@/components/home/motion-enter";
import { BLUR } from "./blur-data";

const SECTORS = [
  "mining",
  "agriculture",
  "energy",
  "infrastructure",
  "forestry",
  "manufacturing",
] as const;

export async function LandingSectors({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.sectors" });
  return (
    <section className="flex min-h-screen flex-col justify-center bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 max-w-2xl">
          <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-landing-gold">
            {t("eyebrow")}
            <span className="h-px w-12 bg-landing-gold/60" />
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-landing-ink)] md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{t("subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((key) => (
            <MotionEnter key={key} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-landing-gold/50 hover:shadow-lg">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={`/images/sectors/${key}.webp`}
                    alt={t(`items.${key}.title`)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL={BLUR[key]}
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-landing-navy)]/45 to-transparent" aria-hidden />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-[var(--color-landing-ink)]">
                    {t(`items.${key}.title`)}
                  </h3>
                  <span className="mt-2 mb-3 block h-0.5 w-8 rounded-full bg-landing-gold" />
                  <p className="text-sm leading-relaxed text-slate-600">{t(`items.${key}.desc`)}</p>
                </div>
              </article>
            </MotionEnter>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-landing-navy)] transition-colors duration-150 ease-out hover:text-landing-gold"
          >
            {t("cta")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
