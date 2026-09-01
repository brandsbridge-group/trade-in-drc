import { notFound } from "next/navigation";
import { fetchPageContentRow, PAGE_CONTENT_SLUGS } from "@/lib/content/pages";
import { PageContentForm } from "../page-content-form";

export default async function PageContentEditPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  if (!(PAGE_CONTENT_SLUGS as readonly string[]).includes(slug)) notFound();

  const initial = await fetchPageContentRow(slug);

  return <PageContentForm slug={slug} initial={initial} />;
}
