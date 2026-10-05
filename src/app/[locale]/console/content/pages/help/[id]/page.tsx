import { notFound } from "next/navigation";
import { fetchHelpArticleRow } from "@/lib/content/pages";
import { HelpArticleForm } from "../../help-article-form";

export default async function EditHelpArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const article = await fetchHelpArticleRow(id);
  if (!article) notFound();

  return <HelpArticleForm mode="edit" initial={article} />;
}
