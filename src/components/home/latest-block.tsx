import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductCardDesign, SkeletonImage } from "@/components/design";
import { Plus } from "lucide-react";
import type { VerificationTier } from "@/lib/trust/types";

interface ProductLite {
  id: string;
  name: string;
  images?: string[] | null;
  company_id: string;
  companies?: { name: string; verification_tier?: VerificationTier | null } | null;
}

interface OppLite {
  id: string;
  title_en: string;
  title_fr: string;
  category: string;
  slug: string;
  region: string | null;
  published_at: string | null;
}

export async function LatestBlock({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home.latest" });
  const supabase = await createServerSupabaseClient();
  let products: ProductLite[] = [];
  let opps: OppLite[] = [];
  try {
    const { data } = await supabase
      .from("products")
      .select("id, name, images, company_id, companies(name, verification_tier)")
      .order("created_at", { ascending: false })
      .limit(3);
    products = ((data ?? []) as unknown as ProductLite[]);
  } catch {}
  try {
    const { data } = await supabase
      .from("opportunities")
      .select("id, title_en, title_fr, category, slug, region, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);
    opps = ((data ?? []) as unknown as OppLite[]);
  } catch {}
  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <div className="rounded-2xl border border-slate-200 bg-card p-5 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 gap-0">
        <div className="pb-5 md:pb-0 md:pr-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">{t("productsTitle")}</h2>
            <Link href="/products" className="text-xs underline text-muted-foreground">{t("productsViewAll")}</Link>
          </div>
          {products.length === 0 ? (
            <Link
              href="/dashboard/products"
              className="flex items-center justify-center gap-1.5 border border-dashed rounded-xl p-6 text-sm text-primary hover:bg-muted/40"
            >
              <Plus className="w-4 h-4" />
              {t("listYourProduct")}
            </Link>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {products[0] && (
                <Link
                  href={`/products/${products[0].id}`}
                  className="group col-span-2 border border-slate-200 rounded-2xl bg-white p-2 hover:border-slate-300 transition"
                >
                  {products[0].images?.[0] ? (
                    <SkeletonImage
                      src={products[0].images[0]}
                      alt=""
                      wrapperClassName="aspect-[16/10] rounded-2xl"
                      className="object-cover"
                    />
                  ) : (
                    <div className="aspect-[16/10] rounded-2xl bg-slate-100" />
                  )}
                  <div className="px-1 pt-2 pb-1">
                    <p className="text-sm font-medium line-clamp-2">{products[0].name}</p>
                    {products[0].companies?.name && (
                      <p className="text-xs text-primary mt-1">{products[0].companies.name}</p>
                    )}
                  </div>
                </Link>
              )}
              <div className="grid grid-rows-2 gap-3">
                {products.slice(1, 3).map((p) => (
                  <ProductCardDesign
                    key={p.id}
                    item={{
                      id: p.id,
                      name: p.name,
                      image_url: p.images?.[0] ?? null,
                      company_id: p.company_id,
                      company_name: p.companies?.name ?? null,
                      verificationTier: p.companies?.verification_tier ?? null,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="pt-5 md:pt-0 md:pl-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">{t("databankTitle")}</h2>
            <Link href="/opportunities" className="text-xs underline text-muted-foreground">{t("databankViewAll")}</Link>
          </div>
          {opps.length === 0 ? (
            <Link
              href="/opportunities/new"
              className="flex items-center justify-center gap-1.5 border border-dashed rounded-xl p-6 text-sm text-primary hover:bg-muted/40"
            >
              <Plus className="w-4 h-4" />
              {t("postOpportunity")}
            </Link>
          ) : (
            <ul className="space-y-2">
              {opps.map((o) => {
                const title = locale === "fr" ? o.title_fr : o.title_en;
                return (
                  <li key={o.id}>
                    <Link href={`/opportunities/${o.category}/${o.slug}`} className="block rounded-xl bg-white border border-slate-200 p-3 hover:border-slate-300 transition">
                      <p className="text-sm font-medium line-clamp-1">{title}</p>
                      {o.region && <p className="text-xs text-muted-foreground">{o.region}</p>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
