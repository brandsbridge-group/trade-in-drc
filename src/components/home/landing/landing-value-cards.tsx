import { getTranslations } from "next-intl/server";
import { Users, Eye, Gem, LineChart, CheckCircle2 } from "lucide-react";
import { MotionEnter } from "@/components/home/motion-enter";

const CORE_KEYS = ["trust", "transparency", "professionalism", "innovation", "commitment"] as const;
const ENABLE_KEYS = ["partnerships", "opportunities", "intelligence", "growth"] as const;

export async function LandingValueCards({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Landing.values" });

  return (
    <section className="relative">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <ValueCard Icon={Users} title={t("who.title")}>
          <p className="text-sm leading-relaxed text-slate-600">{t("who.desc")}</p>
        </ValueCard>

        <ValueCard Icon={Eye} title={t("vision.title")}>
          <p className="text-sm leading-relaxed text-slate-600">{t("vision.desc")}</p>
        </ValueCard>

        <ValueCard Icon={Gem} title={t("coreTitle")}>
          <Checklist items={CORE_KEYS.map((k) => t(`core.${k}`))} />
        </ValueCard>

        <ValueCard Icon={LineChart} title={t("enableTitle")}>
          <Checklist items={ENABLE_KEYS.map((k) => t(`enable.${k}`))} />
        </ValueCard>
      </div>
    </section>
  );
}

function ValueCard({
  Icon,
  title,
  children,
}: {
  Icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <MotionEnter className="h-full">
      <div className="group flex h-full flex-col rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.5)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-landing-gold/60 hover:shadow-[0_28px_80px_-38px_rgba(15,23,42,0.6)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--color-landing-navy)]">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold uppercase tracking-[0.08em] text-[var(--color-landing-navy)]">
          {title}
        </h3>
        <span className="mt-2 mb-3 block h-0.5 w-10 rounded-full bg-landing-gold" />
        {children}
      </div>
    </MotionEnter>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-landing-gold" />
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}
