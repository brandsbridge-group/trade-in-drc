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
    <section className="bg-white py-6 md:py-8">
      <div className="mx-auto w-full max-w-[1500px] px-4 md:px-6">
        <h2 className="text-center font-display text-2xl font-bold tracking-tight text-market-navy md:text-[1.75rem]">
          {t("heading")}
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CONTACT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Link
                key={type.key}
                href={type.href}
                className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-7 text-center transition-colors duration-150 hover:border-market-navy/40 hover:bg-slate-50"
              >
                <Icon
                  className="h-10 w-10 text-market-navy transition-transform duration-150 group-hover:scale-105"
                  strokeWidth={1.5}
                  aria-hidden
                />
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
