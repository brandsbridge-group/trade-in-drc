import type { Locale } from "@/config/locales";
import type { OpportunityCategory } from "@/lib/supabase/types";
import { pickLocalized } from "@/lib/i18n/pick-localized";
import { initialsOf } from "@/lib/marketplace/offers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Serializable snapshot of live platform data for the hero dashboard panel
 * (a client component). Everything here is read from the database.
 */
export interface HeroPanelData {
  stats: {
    opportunities: number;
    closingSoon: number;
    partners: number;
    provinces: number;
    products: number;
    categories: number;
  };
  opportunities: {
    href: string;
    title: string;
    region: string | null;
    category: OpportunityCategory;
    daysLeft: number | null;
  }[];
  partners: {
    href: string;
    name: string;
    sector: string | null;
    place: string | null;
    logo: string | null;
    initials: string;
  }[];
  sectors: { slug: string; name: string; companies: number; products: number }[];
  provinces: { name: string; count: number }[];
  kpis: { budgetUsd: number; newListings30d: number; activeListings: number };
  notifications: { kind: "opportunity" | "company" | "product"; label: string; href: string; at: string }[];
}

const DAY_MS = 86_400_000;

interface CompanyRow {
  id: string;
  name: string;
  sector_id: string | null;
  province: string | null;
  country: string | null;
  registration_profile: string | null;
  logo_url: string | null;
  verified_at: string | null;
  created_at: string;
}

/** The hand-maintained DB types carry no FK relationships for products. */
interface ProductRow {
  id: string;
  name: string;
  name_en: string | null;
  name_fr: string | null;
  category_id: string | null;
  created_at: string;
  companies: { sector_id: string | null; province: string | null; country: string | null; registration_profile: string | null };
}

function placeOf(c: Pick<CompanyRow, "registration_profile" | "province" | "country">): string | null {
  return c.registration_profile === "international" ? c.country : c.province;
}

function topCounts(values: (string | null)[], limit: number): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function loadHeroPanelData(locale: Locale): Promise<HeroPanelData> {
  const supabase = await createServerSupabaseClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const monthAgo = now - 30 * DAY_MS;

  const [oppsRes, companiesRes, productsRes, sectorsRes] = await Promise.all([
    supabase
      .from("opportunities")
      .select("slug, category, title_en, title_fr, region, deadline_at, budget_max, budget_currency, published_at, created_at")
      .eq("status", "published")
      .or(`deadline_at.is.null,deadline_at.gte.${nowIso}`)
      .order("deadline_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("companies")
      .select("id, name, sector_id, province, country, registration_profile, logo_url, verified_at, created_at")
      .eq("status", "verified"),
    supabase
      .from("products")
      .select(
        "id, name, name_en, name_fr, category_id, created_at, companies!inner(sector_id, province, country, registration_profile, status)",
      )
      .eq("companies.status", "verified")
      .order("created_at", { ascending: false }),
    supabase.from("sectors").select("id, slug, name_en, name_fr"),
  ]);

  const opps = oppsRes.data ?? [];
  const companies = (companiesRes.data ?? []) as CompanyRow[];
  const products = (productsRes.data ?? []) as unknown as ProductRow[];
  const sectors = sectorsRes.data ?? [];
  const sectorName = new Map(sectors.map((s) => [s.id, pickLocalized(s, "name", locale)]));

  const daysLeft = (deadline: string | null) =>
    deadline ? Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / DAY_MS)) : null;

  // Sectors ranked by verified companies, with the offers those companies list.
  const sectorRows = sectors
    .map((s) => ({
      slug: s.slug,
      name: sectorName.get(s.id) ?? s.slug,
      companies: companies.filter((c) => c.sector_id === s.id).length,
      products: products.filter((p) => p.companies.sector_id === s.id).length,
    }))
    .filter((s) => s.companies > 0)
    .sort((a, b) => b.companies - a.companies || b.products - a.products)
    .slice(0, 6);

  // Newest verified companies that carry a sector (the directory's core).
  const partners = [...companies]
    .filter((c) => c.sector_id)
    .sort((a, b) => (b.verified_at ?? b.created_at).localeCompare(a.verified_at ?? a.created_at))
    .slice(0, 5)
    .map((c) => ({
      href: `/companies/${c.id}`,
      name: c.name,
      sector: c.sector_id ? (sectorName.get(c.sector_id) ?? null) : null,
      place: placeOf(c),
      logo: c.logo_url,
      initials: initialsOf(c.name),
    }));

  const oppTime = (o: (typeof opps)[number]) => o.published_at ?? o.created_at;
  // Newest event of each kind, so one busy table can't fill the whole list.
  const newestOf = <T extends { at: string }>(rows: T[]) =>
    rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 1);
  const notifications: HeroPanelData["notifications"] = [
    ...newestOf(opps.map((o) => ({
      kind: "opportunity" as const,
      label: pickLocalized(o, "title", locale),
      href: `/opportunities/${o.category}/${o.slug}`,
      at: oppTime(o),
    }))),
    ...newestOf(
      companies.map((c) => ({
        kind: "company" as const,
        label: c.name,
        href: `/companies/${c.id}`,
        at: c.verified_at ?? c.created_at,
      })),
    ),
    ...newestOf(
      products.map((p) => ({
        kind: "product" as const,
        label: pickLocalized(p, "name", locale) || p.name,
        href: `/products/${p.id}`,
        at: p.created_at,
      })),
    ),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    stats: {
      opportunities: opps.length,
      closingSoon: opps.filter((o) => {
        const d = daysLeft(o.deadline_at);
        return d !== null && d <= 30;
      }).length,
      partners: companies.length,
      provinces: new Set(companies.map((c) => c.province).filter(Boolean)).size,
      products: products.length,
      categories: new Set(products.map((p) => p.category_id).filter(Boolean)).size,
    },
    opportunities: opps.slice(0, 5).map((o) => ({
      href: `/opportunities/${o.category}/${o.slug}`,
      title: pickLocalized(o, "title", locale),
      region: o.region,
      category: o.category,
      daysLeft: daysLeft(o.deadline_at),
    })),
    partners,
    sectors: sectorRows,
    provinces: topCounts(
      [
        ...opps.map((o) => o.region),
        ...products.map((p) => (p.companies.registration_profile === "international" ? null : p.companies.province)),
      ],
      5,
    ),
    kpis: {
      budgetUsd: opps
        .filter((o) => (o.budget_currency ?? "USD") === "USD")
        .reduce((sum, o) => sum + (o.budget_max ?? 0), 0),
      newListings30d:
        opps.filter((o) => new Date(oppTime(o)).getTime() >= monthAgo).length +
        products.filter((p) => new Date(p.created_at).getTime() >= monthAgo).length,
      activeListings: opps.length + products.length,
    },
    notifications,
  };
}
