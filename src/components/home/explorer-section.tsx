import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ExplorerTabs } from "./explorer-tabs";
import type { Opportunity } from "@/lib/opportunities/types";

type SectorRow = {
  id: string;
  name_en: string;
  name_fr: string;
  name_tr?: string | null;
  name_zh?: string | null;
  name_es?: string | null;
  slug: string;
};
type ProductRow = {
  id: string;
  name: string;
  images: string[] | null;
  company_id: string;
  companies: { name: string; verification_tier?: string | null } | null;
};
type CompanyRow = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  verification_tier: string | null;
};

async function safeData(p: PromiseLike<{ data: unknown[] | null }>): Promise<unknown[]> {
  try {
    const r = await p;
    return r.data ?? [];
  } catch {
    return [];
  }
}

export async function ExplorerSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.explorer" });
  const supabase = await createServerSupabaseClient();

  const [sectorsRaw, productsRaw, companiesRaw, oppsRaw] = await Promise.all([
    safeData(
      supabase
        .from("sectors")
        .select("id, name_en, name_fr, name_tr, name_zh, name_es, slug")
        .order("name_en")
        .limit(10) as PromiseLike<{ data: unknown[] | null }>
    ),
    safeData(
      supabase
        .from("products")
        .select("id, name, images, company_id, companies(name, verification_tier)")
        .limit(10) as PromiseLike<{ data: unknown[] | null }>
    ),
    safeData(
      supabase
        .from("companies")
        .select("id, name, logo_url, description, verification_tier")
        .eq("status", "verified")
        .order("name")
        .limit(6) as PromiseLike<{ data: unknown[] | null }>
    ),
    safeData(
      supabase
        .from("opportunities")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6) as PromiseLike<{ data: unknown[] | null }>
    ),
  ]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <div className="rounded-2xl border border-slate-200 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
        </div>
        <ExplorerTabs
          locale={locale}
          sectors={sectorsRaw as SectorRow[]}
          products={productsRaw as ProductRow[]}
          companies={companiesRaw as CompanyRow[]}
          opportunities={oppsRaw as Opportunity[]}
        />
      </div>
    </section>
  );
}
