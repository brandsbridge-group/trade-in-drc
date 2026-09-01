import { getTranslations } from "next-intl/server";
import { ConstructionNotice } from "@/components/ui/construction-notice";

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Construction" });

    return <ConstructionNotice title={t("exportGuide")} />;
}
