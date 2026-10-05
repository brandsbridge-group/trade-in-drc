import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SeriesForm } from "../series-form";
import { PointsUploader } from "../points-uploader";
import type { PriceSeries, PricePoint } from "@/lib/data-hub/types";

export default async function PricesEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();

  const [{ data: seriesData }, { data: sectors }, { data: pointsData }] = await Promise.all([
    supabase.from("price_series").select("*").eq("id", id).single(),
    supabase.from("sectors").select("id, name_en, name_fr").order("name_en", { ascending: true }),
    supabase
      .from("price_points")
      .select("*")
      .eq("series_id", id)
      .order("observed_at", { ascending: true }),
  ]);

  if (!seriesData) notFound();

  const series = seriesData as unknown as PriceSeries;
  const points = (pointsData ?? []) as unknown as PricePoint[];

  return (
    <div className="space-y-8">
      <SeriesForm mode="edit" initial={series} sectors={sectors ?? []} />
      <PointsUploader seriesId={id} initialPoints={points} />
    </div>
  );
}
