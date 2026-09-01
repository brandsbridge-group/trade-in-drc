import { getTranslations } from "next-intl/server";
import { ShieldCheck, BarChart3, Brain } from "lucide-react";
import { MotionEnter } from "@/components/home/motion-enter";

const FEATURES = [
  { key: "verified", Icon: ShieldCheck },
  { key: "opportunities", Icon: BarChart3 },
  { key: "intelligence", Icon: Brain },
] as const;

export async function LandingFeatures({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.features" });
  return (
    <section>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-20 pt-4 md:grid-cols-3">
        {FEATURES.map(({ key, Icon }) => (
          <MotionEnter key={key}>
            <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-landing-gold/50 hover:shadow-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-landing-navy)]/5 text-[var(--color-landing-navy)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--color-landing-ink)]">
                {t(`${key}.title`)}
              </h3>
              <span className="mt-2 block h-0.5 w-8 rounded-full bg-landing-gold" />
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {t(`${key}.desc`)}
              </p>
            </div>
          </MotionEnter>
        ))}
      </div>
    </section>
  );
}
