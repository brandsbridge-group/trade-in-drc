import { getTranslations } from "next-intl/server";

export default async function CookiesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Cookies" });

    const cookieTypes = ["essential", "analytics", "functionality"] as const;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-16 max-w-3xl">
                <h1 className="text-4xl font-bold mb-8">{t("title")}</h1>

                <div className="prose prose-slate max-w-none space-y-6">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        {t("intro")}
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">
                            {t("sections.what.heading")}
                        </h2>
                        <p className="text-muted-foreground">{t("sections.what.body")}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">
                            {t("sections.why.heading")}
                        </h2>
                        <p className="text-muted-foreground">{t("sections.why.body")}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">
                            {t("sections.types.heading")}
                        </h2>
                        <div className="space-y-4">
                            {cookieTypes.map((type) => (
                                <div
                                    key={type}
                                    className="bg-card border border-slate-200 p-4 rounded-xl"
                                >
                                    <h3 className="font-semibold text-lg mb-2">
                                        {t(`types.${type}.title`)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {t(`types.${type}.body`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">
                            {t("sections.control.heading")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("sections.control.body")}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">
                            {t("sections.updates.heading")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("sections.updates.body")}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mt-8 mb-4">
                            {t("sections.contact.heading")}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("sections.contact.body")}
                        </p>
                    </section>

                    <p className="text-sm text-muted-foreground mt-12 pt-8 border-t">
                        {t("lastUpdated")}
                    </p>
                </div>
            </div>
        </div>
    );
}
