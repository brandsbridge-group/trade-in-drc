import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { fetchPublishedFaqs, type Locale } from "@/lib/content/pages";
import { FaqClient } from "./faq-client";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faq" });
  const faqs = await fetchPublishedFaqs(locale as Locale);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={t("title")} description={t("description")} />
      <FaqClient faqs={faqs} />
    </div>
  );
}
