import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/console/page-header";
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
            href="/console/content/pages/help/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-market-navy px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-market-navy-deep"
          >
            {t("addNew")}
          </Link>
        }
      />
      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("help.empty")}</p>
      ) : (
        <div className="console-table-card">
        <table className="w-full text-sm border-collapse">
          <thead className="text-left">
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
                    href={`/console/content/pages/help/${a.id}`}
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
        </div>
      )}
    </div>
  );
}
