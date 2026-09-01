import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBySlug } from "@/lib/opportunities/queries";
import { isOpportunityCategory } from "@/lib/opportunities/categories";
import { CategoryBadge } from "@/components/opportunities/category-badge";
import { MarkdownView } from "@/components/content/markdown-view";
import { ContactButton } from "@/components/opportunities/contact-button";
import { RespondDialog } from "@/components/opportunities/respond-dialog";
import { PageHeader } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import { Breadcrumb } from "@/components/detail/breadcrumb";

export default async function OpportunityDetail({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  if (!isOpportunityCategory(category)) notFound();
  const t = await getTranslations({ locale, namespace: "Opportunities" });
  const supabase = await createServerSupabaseClient();
  const op = await getBySlug(supabase, category, slug);
  if (!op) notFound();

  // Owner of the posting company — lets the response form block self-responses
  // and the contact thread add the right participant.
  const { data: company } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", op.company_id)
    .maybeSingle();
  const ownerId = (company as { owner_id: string } | null)?.owner_id ?? null;

  const title = locale === "fr" ? op.title_fr : op.title_en;
  const summary = locale === "fr" ? op.summary_fr : op.summary_en;
  const body = locale === "fr" ? op.body_fr : op.body_en;
  const deadline = op.deadline_at ? new Date(op.deadline_at).toLocaleDateString(locale) : null;
  const budget =
    op.budget_min || op.budget_max
      ? `${op.budget_min ?? ""}${op.budget_min && op.budget_max ? " – " : ""}${op.budget_max ?? ""} ${op.budget_currency ?? ""}`.trim()
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: t("navLabel"), href: "/opportunities" },
          { label: t(`categories.${op.category}`), href: `/opportunities?category=${op.category}` },
          { label: title },
        ]}
      />
      <PageHeader
        title={title}
        subtitle={summary ?? undefined}
        action={<CategoryBadge category={op.category} />}
      />
      <div className="mt-3">
        <PageMeta
          items={[
            ...(deadline ? [{ label: t("fields.deadline"), value: deadline }] : []),
            ...(budget ? [{ label: t("fields.budget"), value: budget }] : []),
            ...(op.region ? [{ label: t("fields.region"), value: op.region }] : []),
          ]}
        />
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          {body && <MarkdownView source={body} />}
        </div>
        <Sidecar>
          <div className="space-y-2">
            {ownerId && (
              <RespondDialog
                opportunityId={op.id}
                opportunityTitle={title}
                ownerId={ownerId}
              />
            )}
            <ContactButton
              companyId={op.company_id}
              subject={title}
              opportunityId={op.id}
            />
          </div>
        </Sidecar>
      </div>
    </div>
  );
}
