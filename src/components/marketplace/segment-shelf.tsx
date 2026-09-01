import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/routing";
import type { SegmentKey } from "@/lib/marketplace/segments";

interface ShelfRow {
  company_id: string;
  companies: { id: string; name: string; verification_tier: string | null } | null;
}

export async function SegmentShelf({ segment, limit = 6 }: { segment: SegmentKey; limit?: number }) {
  const supabase = await createServerSupabaseClient();
  // Filter to verified companies DB-side via an inner join, THEN limit — so the
  // shelf shows up to `limit` verified companies instead of limiting first and
  // dropping unverified ones afterwards (which could show fewer than exist).
  const { data } = await supabase
    .from("company_segments")
    .select("company_id, companies!inner(id, name, verification_tier, status)")
    .eq("segment_key", segment)
    .eq("companies.status", "verified")
    .limit(limit);
  const rows = ((data ?? []) as unknown as ShelfRow[]).filter((r) => r.companies);
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">—</p>;
  }
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      {rows.map((r) => (
        <Link
          key={r.company_id}
          href={`/companies/${r.companies!.id}`}
          className="border rounded-md p-3 bg-card hover:bg-muted/40 text-sm transition"
        >
          {r.companies!.name}
        </Link>
      ))}
    </div>
  );
}
