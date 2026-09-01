import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  fetchPublishedHelpArticle,
  bodyToParagraphs,
  type Locale,
} from "@/lib/content/pages";

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "Help" });

  const article = await fetchPublishedHelpArticle(slug, loc);
  if (!article) notFound();

  const paragraphs = bodyToParagraphs(article.body);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={article.title} description={article.category ?? undefined} />

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/help"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHelp")}
        </Link>

        {paragraphs.length > 0 ? (
          <div className="space-y-4 leading-relaxed text-slate-700">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{t("articleEmpty")}</p>
        )}
      </article>
    </div>
  );
}
