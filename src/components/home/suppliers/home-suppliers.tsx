import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";

import { Link } from "@/i18n/routing";
import type { Locale } from "@/config/locales";
import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { initialsOf, offerVisual, tierGroup } from "@/lib/marketplace/offers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MotionEnter } from "@/components/home/motion-enter";
import { HomeSection, HomeSectionHeader } from "@/components/home/home-section";

const HOW_MANY = 4;

/** The hand-maintained DB types carry no FK relationships for companies. */
interface SupplierRow {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  country: string | null;
  registration_profile: string | null;
  logo_url: string | null;
  verification_tier: string | null;
  verified_at: string | null;
  sector_id: string | null;
  products: { images: string[] | null }[];
}

interface Supplier {
  id: string;
  name: string;
  logo: string | null;
  initials: string;
  sector: string | null;
  place: string | null;
  offers: number;
  premium: boolean;
  visual: { src: string; illustrative: boolean };
}

/**
 * Four fully verified sellers with live offers, one per sector so the row
 * shows the breadth of the directory; premium first, then the busiest.
 */
async function loadSuppliers(locale: Locale): Promise<Supplier[]> {
  const supabase = await createServerSupabaseClient();
  const [companiesRes, sectorsRes] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, city, province, country, registration_profile, logo_url, verification_tier, verified_at, sector_id, products(images)",
      )
      .eq("status", "verified")
      .in("verification_tier", ["verified", "premium"]),
    supabase.from("sectors").select("id, slug, name_en, name_fr"),
  ]);
  const sectors = new Map((sectorsRes.data ?? []).map((s) => [s.id, s]));

  const ranked = ((companiesRes.data ?? []) as unknown as SupplierRow[])
    .filter((c) => c.products.length > 0 && tierGroup(c.verification_tier) === "full")
    .sort(
      (a, b) =>
        Number(b.verification_tier === "premium") - Number(a.verification_tier === "premium") ||
        b.products.length - a.products.length ||
        (b.verified_at ?? "").localeCompare(a.verified_at ?? ""),
    );

  const seen = new Set<string | null>();
  const picked: SupplierRow[] = [];
  for (const c of ranked) {
    if (picked.length === HOW_MANY) break;
    if (seen.has(c.sector_id)) continue;
    seen.add(c.sector_id);
    picked.push(c);
  }

  return picked.map((c) => {
    const sector = c.sector_id ? sectors.get(c.sector_id) : undefined;
    const photo = c.products.find((p) => p.images && p.images.length > 0)?.images ?? null;
    return {
      id: c.id,
      name: c.name,
      logo: c.logo_url,
      initials: initialsOf(c.name),
      sector: sector ? pickLocalized(sector, "name", locale) : null,
      place: c.registration_profile === "international" ? c.country : (c.city ?? c.province),
      offers: c.products.length,
      premium: c.verification_tier === "premium",
      visual: offerVisual(photo, sector?.slug ?? null),
    };
  });
}

/** Homepage section 5 — a row of verified suppliers linking to their profiles. */
export async function HomeSuppliers({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "HomeSuppliers" });
  const suppliers = await loadSuppliers(locale as Locale);
  if (suppliers.length === 0) return null;

  return (
    <HomeSection id="suppliers">
      <MotionEnter>
        <HomeSectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
          action={
            <Link
              href="/companies"
              className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-market-or-dark transition-colors duration-150 ease-out hover:text-[var(--color-landing-navy)]"
            >
              {t("viewAll")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
            </Link>
          }
        />
      </MotionEnter>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {suppliers.map((s) => (
          <li key={s.id}>
            <MotionEnter className="h-full">
              <Link
                href={`/companies/${s.id}`}
                className="group flex h-full flex-col rounded-[1.25rem] bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 transition-[box-shadow] duration-150 ease-out hover:shadow-lg hover:shadow-slate-900/[0.06] hover:ring-slate-300"
              >
                <span className="relative block aspect-[4/3] overflow-hidden rounded-[0.9rem] bg-slate-100">
                  {s.visual.illustrative ? (
                    <Image
                      src={s.visual.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 270px, 45vw"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    // Supplier uploads live on arbitrary storage hosts.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.visual.src}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  )}
                  {s.place && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-950/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                      <MapPin className="h-2.5 w-2.5" aria-hidden />
                      {s.place}
                    </span>
                  )}
                  {s.visual.illustrative && (
                    <span className="absolute bottom-1.5 right-2 text-[9px] font-medium text-white/70">{t("illustration")}</span>
                  )}
                </span>

                <span className="flex flex-1 flex-col px-2 pb-2 pt-3">
                  <span className="flex items-center gap-2.5">
                    <span className="hidden h-8 w-8 flex-none place-items-center overflow-hidden rounded-lg bg-market-navy text-[11px] font-bold text-white sm:grid">
                      {s.logo ? (
                        // Company logos live on arbitrary hosts.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logo} alt="" className="h-full w-full bg-white object-contain p-0.5" />
                      ) : (
                        s.initials
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-[13px] font-semibold leading-tight text-[var(--color-landing-navy)] transition-colors duration-150 ease-out group-hover:text-market-or-dark lg:line-clamp-1">
                        {s.name}
                      </span>
                      {s.sector && <span className="block truncate text-[11px] text-slate-500">{s.sector}</span>}
                    </span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px]">
                    <span className="font-medium text-slate-600">{t("offers", { count: s.offers })}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold",
                        s.premium ? "bg-market-or/15 text-market-or-dark" : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      {s.premium ? t("premium") : t("verified")}
                    </span>
                  </span>
                </span>
              </Link>
            </MotionEnter>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
