import { notFound } from "next/navigation";
import { fetchFaqRow } from "@/lib/content/pages";
import { FaqForm } from "../../faq-form";

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const faq = await fetchFaqRow(id);
  if (!faq) notFound();

  return <FaqForm mode="edit" initial={faq} />;
}
