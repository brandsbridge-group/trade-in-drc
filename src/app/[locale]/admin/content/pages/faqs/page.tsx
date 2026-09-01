import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/design";
import { fetchAllFaqs } from "@/lib/content/pages";

export default async function FaqsAdminListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCms" });
  const faqs = await fetchAllFaqs();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("faqs.title")}
        action={
          <Link
            href="/admin/content/pages/faqs/new"
            className="h-9 inline-flex items-center text-sm bg-primary text-primary-foreground px-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            {t("addNew")}
          </Link>
        }
      />
      {faqs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("faqs.empty")}</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2 font-medium">{t("columns.question")}</th>
              <th className="py-2 font-medium">{t("columns.category")}</th>
              <th className="py-2 font-medium">{t("columns.order")}</th>
              <th className="py-2 font-medium">{t("columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((f) => (
              <tr key={f.id} className="border-b hover:bg-muted/30">
                <td className="py-2">
                  <Link
                    href={`/admin/content/pages/faqs/${f.id}`}
                    className="underline underline-offset-2 hover:text-primary"
                  >
                    {f.question_en}
                  </Link>
                </td>
                <td className="py-2 text-muted-foreground">{f.category ?? "—"}</td>
                <td className="py-2 text-muted-foreground">{f.sort_order}</td>
                <td className="py-2">
                  <span className={f.published ? "text-emerald-600" : "text-muted-foreground"}>
                    {f.published ? t("status.published") : t("status.draft")}
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
