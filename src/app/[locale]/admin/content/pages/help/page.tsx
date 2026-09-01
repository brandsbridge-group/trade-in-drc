import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { fetchAllHelpArticles } from "@/lib/content/pages";

export default async function HelpAdminListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCms" });
  const articles = await fetchAllHelpArticles();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("help.title")}
        action={
          <Link
            href="/admin/content/pages/help/new"
            className="h-9 inline-flex items-center text-sm bg-primary text-primary-foreground px-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            {t("addNew")}
          </Link>
        }
      />
      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("help.empty")}</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2 font-medium">{t("columns.title")}</th>
              <th className="py-2 font-medium">{t("columns.category")}</th>
              <th className="py-2 font-medium">{t("columns.order")}</th>
              <th className="py-2 font-medium">{t("columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b hover:bg-muted/30">
                <td className="py-2">
                  <Link
                    href={`/admin/content/pages/help/${a.id}`}
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    {a.title_en}
                  </Link>
                </td>
                <td className="py-2 text-muted-foreground">{a.category ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{a.sort_order}</td>
                <td className="py-2">
                  <span className={a.published ? "text-emerald-600" : "text-muted-foreground"}>
                    {a.published ? t("status.published") : t("status.draft")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
