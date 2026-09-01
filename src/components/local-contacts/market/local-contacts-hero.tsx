import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { UserRoundPlus } from "lucide-react";
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
      {/* Left-weighted navy overlay keeps the heading + card legible over the photo. */}
      <div className="absolute inset-0 bg-gradient-to-r from-market-navy via-market-navy/90 to-market-navy/30" />

      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-8 md:px-6">
        <h1 className="max-w-xl font-display text-2xl font-bold leading-tight tracking-tight md:text-[2.1rem]">
          {t("hero.title")}
        </h1>
        <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-white/85">
          {t("hero.subtitle")}
        </p>

        <div className="mt-4 max-w-5xl">
          <ContactSearchCard sectors={sectors} />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-md bg-market-gold px-5 py-2.5 text-sm font-semibold text-market-navy transition-colors duration-150 hover:bg-market-gold/90"
          >
            {t("heroCta.requestPartner")}
          </Link>
          <Link
            href="/register-company"
            className="inline-flex items-center gap-2 rounded-md border-2 border-white/80 bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10"
          >
            <UserRoundPlus className="h-4 w-4" aria-hidden />
            {t("heroCta.registerContact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
