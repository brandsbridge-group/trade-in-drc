import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isReportKind } from "@/lib/data-hub/kinds";
import { ReportForm } from "../../report-form";
import type { Report } from "@/lib/data-hub/types";

export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  if (!isReportKind(kind)) notFound();

  const supabase = await createServerSupabaseClient();

  const [{ data: reportData }, { data: sectors }] = await Promise.all([
    supabase.from("reports").select("*").eq("id", id).single(),
    supabase.from("sectors").select("id, name_en, name_fr").order("name_en", { ascending: true }),
  ]);

  if (!reportData) notFound();

  return (
    <ReportForm
      kind={kind}
      mode="edit"
      initial={reportData as unknown as Report}
      sectors={sectors ?? []}
    />
  );
}
