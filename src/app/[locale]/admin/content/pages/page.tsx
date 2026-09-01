import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import {
  fetchAllPageContent,
  PAGE_CONTENT_SLUGS,
  type PageContentRow,
} from "@/lib/content/pages";

export default async function PagesCmsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCms" });

  const rows = await fetchAllPageContent();
  const bySlug = new Map<string, PageContentRow>(rows.map((r) => [r.slug, r]));

  return (
    <div className="space-y-4">
      <PageHeader title={t("pages.title")} />
      <table className="w-full text-sm border-collapse">
        <thead className="text-left text-xs text-muted-foreground border-b">
          <tr>
            <th className="py-2 font-medium">{t("columns.page")}</th>
            <th className="py-2 font-medium">{t("columns.status")}</th>
            <th className="py-2 font-medium">{t("columns.updated")}</th>
          </tr>
        </thead>
        <tbody>
          {PAGE_CONTENT_SLUGS.map((slug) => {
            const row = bySlug.get(slug);
            const status = row?.status ?? "draft";
            return (
              <tr key={slug} className="border-b hover:bg-muted/30">
                <td className="py-2">
                  <Link
                    href={`/admin/content/pages/${slug}`}
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    {t(`pageSlugs.${slug}`)}
                  </Link>
                </td>
                <td className="py-2">
                  <span
                    className={
                      status === "published"
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }
                  >
                    {t(`status.${status}`)}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  {row ? new Date(row.updated_at).toLocaleDateString(locale) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
