import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isReportKind } from "@/lib/data-hub/kinds";
import { getReportBySlug } from "@/lib/data-hub/queries";
import { MarkdownView } from "@/components/content/markdown-view";
import { PageHeader } from "@/components/design";
import { PageMeta } from "@/components/detail/page-meta";
import { Sidecar } from "@/components/detail/sidecar";
import { Breadcrumb } from "@/components/detail/breadcrumb";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ locale: string; kind: string; slug: string }>;
}) {
  const { locale, kind, slug } = await params;
  if (!isReportKind(kind)) notFound();
  const supabase = await createServerSupabaseClient();
  const item = await getReportBySlug(supabase, kind, slug);
  if (!item) notFound();
  const t = await getTranslations({ locale, namespace: "DataHub" });
  const title = locale === "fr" ? item.title_fr : item.title_en;
  const summary = locale === "fr" ? item.summary_fr : item.summary_en;
  const body = locale === "fr" ? item.body_fr : item.body_en;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: t("navLabel"), href: "/data-hub" },
          { label: t(`pillars.${item.kind}.title`), href: `/data-hub/reports/${item.kind}` },
          { label: title },
        ]}
      />
      <PageHeader title={title} subtitle={summary ?? undefined} />
      <div className="mt-3">
        <PageMeta
          items={[
            ...(item.published_at
              ? [{ value: new Date(item.published_at).toLocaleDateString(locale) }]
              : []),
            { value: t(`pillars.${item.kind}.title`) },
          ]}
        />
      </div>
      <div className="grid md:grid-cols-[1fr_280px] gap-6 mt-6">
        <div className="min-w-0">
          {body && <MarkdownView source={body} />}
        </div>
        <Sidecar>
          {item.attachment_url && (
            <a
              href={item.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-primary text-primary-foreground rounded-full py-2 text-sm font-medium hover:bg-primary/90"
            >
              {t("report.download")}
            </a>
          )}
        </Sidecar>
      </div>
    </div>
  );
}
