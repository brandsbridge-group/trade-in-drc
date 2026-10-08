import { getTranslations } from "next-intl/server";
import type { LucideIcon } from "lucide-react";
import { Boxes, Truck, UserRound, Wrench, Landmark, Handshake } from "lucide-react";
import { Link } from "@/i18n/routing";

interface ContactTypeBlueprint {
  key:
    | "suppliers"
    | "distributors"
    | "representatives"
    | "serviceProviders"
    | "institutional"
    | "investment";
  icon: LucideIcon;
  href: string;
}

/**
 * The six contact-type cards (customer design 3). There is no `contact_type`
 * column in the schema, so these are static navigational cards: most deep-link
 * into the companies directory, Institutional → contact points, Investment →
 * the partner-request flow.
 */
const CONTACT_TYPES: readonly ContactTypeBlueprint[] = [
  { key: "suppliers", icon: Boxes, href: "/companies" },
  { key: "distributors", icon: Truck, href: "/companies" },
  { key: "representatives", icon: UserRound, href: "/companies" },
  { key: "serviceProviders", icon: Wrench, href: "/companies" },
  { key: "institutional", icon: Landmark, href: "/contact-points" },
  { key: "investment", icon: Handshake, href: "/request" },
] as const;

export async function ContactTypeCards() {
  const t = await getTranslations("LocalContacts.contactTypes");

  return (
    <section className="bg-transparent py-6 md:py-8">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <div className="mb-5 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-market-gold" />
            {t("heading")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CONTACT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.key}
                href={type.href}
                className="group flex flex-col items-center justify-center gap-3 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-7 text-center shadow-[0_18px_45px_-36px_rgba(15,23,42,0.7)] transition-all duration-200 hover:-translate-y-1 hover:border-market-navy/30 hover:shadow-[0_24px_50px_-34px_rgba(15,23,42,0.72)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-market-navy transition-all duration-200 group-hover:bg-market-navy group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden />
                </span>
                <span className="text-sm font-semibold leading-snug text-market-navy">
                  {t(type.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
