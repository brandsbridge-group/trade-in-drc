import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { RfqCtaBanner } from "@/components/design";

export async function RfqCtaSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Home" });
  const td = await getTranslations({ locale, namespace: "Design" });
  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <RfqCtaBanner
        title={t("rfqCta")}
        action={
          <Link href="/dashboard/opportunities/new" className="text-sm bg-white text-primary px-3 py-1.5 rounded-md font-medium">
            {td("rfqBanner.action")}
          </Link>
        }
      />
    </section>
  );
}
