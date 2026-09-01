import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DRC_PROVINCES } from "@/config/provinces";
import { Briefcase, Users, Layers, MapPin } from "lucide-react";

function approx(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "+";
  if (n >= 20) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

/** White stats card (design 2): four live board metrics with navy icons. */
export async function OppStatsCard() {
  const t = await getTranslations("Opportunities.stats");
  const supabase = await createServerSupabaseClient();

  const [opps, companies, sectors] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "verified"),
    supabase.from("sectors").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { Icon: Briefcase, value: approx(opps.count ?? 0), label: t("opportunities") },
    { Icon: Users, value: approx(companies.count ?? 0), label: t("companies") },
    { Icon: Layers, value: String(sectors.count ?? 0), label: t("sectors") },
    { Icon: MapPin, value: String(DRC_PROVINCES.length), label: t("provinces") },
  ];

  return (
    <div className="grid grid-cols-2 gap-y-4 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:grid-cols-4">
      {stats.map(({ Icon, value, label }, i) => (
        <div key={label} className={`flex items-center gap-3 ${i > 0 ? "sm:border-l sm:border-slate-200 sm:pl-4" : ""}`}>
          <Icon className="h-8 w-8 shrink-0 text-market-navy" strokeWidth={1.75} aria-hidden />
          <div>
            <div className="font-display text-lg font-bold leading-tight text-market-navy">{value}</div>
            <div className="text-[11px] text-slate-500">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
