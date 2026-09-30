import { getTranslations } from "next-intl/server";

import type { Locale } from "@/config/locales";
import { initialsOf } from "@/lib/marketplace/offers";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MarketDemandsList, type DemandItem } from "./market-demands-list";

const DAY_MS = 86_400_000;
const HOW_MANY = 12;

interface DemandRow {
  id: string;
  slug: string;
  category: string;
  region: string | null;
  deadline_at: string | null;
  title_en: string | null;
  title_fr: string | null;
  title_es: string | null;
  title_tr: string | null;
  title_zh: string | null;
  company: {
    name: string | null;
    logo_url: string | null;
    status: string | null;
    verification_tier: string | null;
    registration_profile: string | null;
    city: string | null;
    country: string | null;
  } | null;
}

/**
 * Published buyer demands and quotation requests that have not closed yet,
 * soonest deadline first. Direction follows the buyer's declared profile
 * (`companies.registration_profile`): a Congolese buyer is importing into the
 * DRC, an international one is sourcing from it.
 */
async function loadOpenDemands(locale: string): Promise<DemandItem[]> {
  const supabase = await createServerSupabaseClient();
  const now = Date.now();

  const { data } = await supabase
    .from("opportunities")
    .select(
      "id, slug, category, region, deadline_at, title_en, title_fr, title_es, title_tr, title_zh, company:companies(name, logo_url, status, verification_tier, registration_profile, city, country)"
    )
    .eq("status", "published")
    .in("category", ["demand", "quotation"])
    .or(`deadline_at.is.null,deadline_at.gte.${new Date(now).toISOString()}`)
    .order("deadline_at", { ascending: true, nullsFirst: false })
    .limit(HOW_MANY);

  // Formatted here (fixed zone) so server and client render the same string.
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Kinshasa",
  });

  return ((data ?? []) as unknown as DemandRow[]).map((o) => {
    const c = o.company;
    return {
      id: o.id,
      href: `/opportunities/${o.category}/${o.slug}`,
      title: pickLocalized(o, "title", locale as Locale),
      kind: o.category === "quotation" ? "quotation" : "demand",
      buyerName: c?.name ?? null,
      buyerInitials: c?.name ? initialsOf(c.name) : "?",
      buyerLogo: c?.logo_url ?? null,
      deadline: o.deadline_at ? dateFmt.format(new Date(o.deadline_at)) : null,
      direction: c?.registration_profile === "international" ? "export" : "import",
      verified: c?.status === "verified" && !!c.verification_tier && c.verification_tier !== "none",
      location: o.region ?? c?.city ?? c?.country ?? null,
      closesInDays: o.deadline_at
        ? Math.max(0, Math.ceil((new Date(o.deadline_at).getTime() - now) / DAY_MS))
        : null,
    };
  });
}

/** Decides whether the request links go straight through or via /login. */
async function isSignedIn(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

/** "Open requests" section with the Import / Export filter. */
export async function MarketDemands({ locale }: { locale: string }) {
  const t = await getTranslations("MarketLanding.demands");
  const [items, signedIn] = await Promise.all([loadOpenDemands(locale), isSignedIn()]);

  return (
    <section className="bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-landing-navy)] md:text-[22px]">
          {t("heading")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">{t("lead")}</p>

        <MarketDemandsList items={items} signedIn={signedIn} />
      </div>
    </section>
  );
}
