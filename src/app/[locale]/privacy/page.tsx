import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Privacy" });

    const sections = [
        "collect",
        "use",
        "sharing",
        "security",
        "retention",
        "rights",
        "governmentSharing",
        "changes",
    ] as const;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 max-w-3xl">
                <h1 className="text-4xl font-bold mb-8">{t("title")}</h1>

                <div className="prose prose-slate max-w-none space-y-6">
                    {sections.map((section, index) => (
                        <section key={section}>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">
                                {t(`sections.${section}.heading`, { number: index + 1 })}
                            </h2>
                            <p className="text-muted-foreground">
                                {t(`sections.${section}.body`)}
                            </p>
                        </section>
                    ))}

                    <p className="text-sm text-muted-foreground mt-12">
                        {t("lastUpdated")}
                    </p>
                </div>
            </div>
        </div>
    );
}
