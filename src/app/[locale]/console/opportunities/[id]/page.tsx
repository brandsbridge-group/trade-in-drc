import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MarkdownView } from "@/components/content/markdown-view";
import { PageHeader } from "@/components/design";
import { CategoryBadge } from "@/components/opportunities/category-badge";
import { ReviewActions } from "./review-actions";
import type { Opportunity } from "@/lib/opportunities/types";
import { isOpportunityCategory } from "@/lib/opportunities/categories";

export default async function AdminOpportunityReviewPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*, companies(name)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const op = data as unknown as Opportunity & {
    companies: { name: string } | null;
  };

  if (!isOpportunityCategory(op.category)) notFound();

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title={op.title_en}
        subtitle={`${op.companies?.name ?? "—"} · ${t("admin.statusHeading")}: ${t(`status.${op.status}`)}`}
        action={<CategoryBadge category={op.category} />}
      />
      <p className="text-sm">{op.summary_en}</p>
      {op.body_en && <MarkdownView source={op.body_en} />}
      <ReviewActions id={op.id} initialStatus={op.status} />
    </div>
  );
}
