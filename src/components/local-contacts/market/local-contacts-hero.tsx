import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ContactSearchCard } from "./contact-search-card";

interface SectorOption {
  id: string;
  label: string;
}

/**
 * Local Contacts hub hero (customer design 3): full-bleed Kinshasa skyline photo
 * under a left-weighted navy overlay, a white marketing headline + subtitle, the
 * floating 4-field search card, and a gold / navy-outline CTA pair.
 */
export async function LocalContactsHero({ sectors }: { sectors: SectorOption[] }) {
  const t = await getTranslations("LocalContacts");

  return (
    <section className="relative overflow-hidden bg-market-navy text-white">
      <Image
        src="/images/directory/skyline.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-market-navy via-market-navy/90 to-market-navy/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,188,72,0.18),transparent_28%)]" />

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-10 md:px-6 md:py-12">
        <h1 className="max-w-3xl font-display text-[1.8rem] font-bold leading-[1.12] md:text-[2.6rem]">
          {t("hero.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base md:leading-7">
          {t("hero.subtitle")}
        </p>

        <div className="mt-6 max-w-6xl">
          <ContactSearchCard sectors={sectors} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-full bg-market-or px-5 py-2.5 text-sm font-semibold text-market-navy shadow-[0_18px_30px_-22px_rgba(203,161,78,0.55)] transition-colors duration-150 hover:bg-market-or-light"
          >
            {t("heroCta.requestPartner")}
          </Link>
        </div>
      </div>
    </section>
  );
}
