import { getTranslations } from "next-intl/server";
import { UserPlus, ShieldCheck, Handshake } from "lucide-react";
import { MotionEnter } from "@/components/home/motion-enter";

const STEPS = [
  { key: "register", num: "01", Icon: UserPlus },
  { key: "verify", num: "02", Icon: ShieldCheck },
  { key: "connect", num: "03", Icon: Handshake },
] as const;

export async function LandingHowItWorks({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.howItWorks" });
  return (
    <section className="flex min-h-screen flex-col justify-center bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-landing-gold">
            {t("eyebrow")}
            <span className="h-px w-12 bg-landing-gold/60" />
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-landing-ink)] md:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ key, num, Icon }) => (
            <MotionEnter key={key} className="h-full">
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-landing-gold/50 hover:shadow-md">
                <span className="absolute right-5 top-4 text-3xl font-extrabold text-[var(--color-landing-navy)]/10">
                  {num}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-landing-navy)]/5 text-[var(--color-landing-navy)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-landing-ink)]">
                  {t(`steps.${key}.title`)}
                </h3>
                <span className="mt-2 mb-3 block h-0.5 w-8 rounded-full bg-landing-gold" />
                <p className="text-sm leading-relaxed text-slate-600">{t(`steps.${key}.desc`)}</p>
              </div>
            </MotionEnter>
          ))}
        </div>
      </div>
    </section>
  );
}
