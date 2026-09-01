import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { fetchPublishedHelpArticles, type Locale } from "@/lib/content/pages";
import { HelpList } from "./help-list";

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Help" });
  const articles = await fetchPublishedHelpArticles(locale as Locale);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={t("title")} description={t("description")} />
      <HelpList articles={articles} />
    </div>
  );
}
