import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VERIFICATION_TIER } from "@/constants/status";
import { DRC_PROVINCES } from "@/config/provinces";
import { Package, Building2, ShieldCheck, MapPin, LayoutGrid } from "lucide-react";

/** Compact "5,000+" style formatting for the stats band. */
function approx(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "+";
  if (n >= 20) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

/** Navy stats band (design 1): five live platform counts with gold icons. */
export async function MarketStatsBand() {
  const t = await getTranslations("MarketHome.stats");
  const supabase = await createServerSupabaseClient();

  const [products, companies, verified, categories] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "verified"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("status", "verified")
      .in("verification_tier", [VERIFICATION_TIER.VERIFIED, VERIFICATION_TIER.PREMIUM]),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { Icon: Package, value: approx(products.count ?? 0), label: t("products") },
    { Icon: Building2, value: approx(companies.count ?? 0), label: t("companies") },
    { Icon: ShieldCheck, value: approx(verified.count ?? 0), label: t("verifiedSuppliers") },
    { Icon: MapPin, value: String(DRC_PROVINCES.length), label: t("provinces") },
    { Icon: LayoutGrid, value: approx(categories.count ?? 0), label: t("categories") },
  ];

  return (
    <section className="bg-market-navy-deep text-white">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-2 gap-y-4 px-4 py-3.5 sm:grid-cols-3 md:grid-cols-5 md:px-6">
        {stats.map(({ Icon, value, label }, i) => (
          <div
            key={label}
            className={`flex items-center justify-center gap-3 ${i > 0 ? "md:border-l md:border-white/10" : ""}`}
          >
            <Icon className="h-7 w-7 text-market-gold" strokeWidth={1.75} aria-hidden />
            <div>
              <div className="font-display text-lg font-bold leading-tight">{value}</div>
              <div className="text-[11px] text-white/70">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
