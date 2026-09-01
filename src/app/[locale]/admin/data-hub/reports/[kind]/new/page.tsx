import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isReportKind } from "@/lib/data-hub/kinds";
import { ReportForm } from "../../report-form";

export default async function ReportNewPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const { kind } = await params;
  if (!isReportKind(kind)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: sectors } = await supabase
    .from("sectors")
    .select("id, name_en, name_fr")
    .order("name_en", { ascending: true });

  return (
    <ReportForm
      kind={kind}
      mode="create"
      sectors={sectors ?? []}
    />
  );
}
